<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 antialiased">
    
    <!-- Universal Top Navigation Bar (Cross-Platform Header) -->
    <header class="border-b border-slate-800/80 bg-slate-900/98 sticky top-0 z-50">
      <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        
        <!-- Platform Name & Logo (GAMMA) -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <span class="text-xl font-black font-mono">Γ</span>
          </div>
          <div>
            <h1 class="text-xl font-black tracking-wider text-white">MAGMA</h1>
          </div>
        </div>

        <!-- Right Side: Language Selector, View Mode Toggle & WebSocket Status -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Language Selector Button Group -->
          <div class="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2 py-1 text-xs text-slate-300 font-bold shadow-sm">
            <span class="text-xs">🌐</span>
            <button @click="setLanguage('ar')" :class="currentLang === 'ar' ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-white transition-colors'">AR</button>
            <span class="text-slate-600">|</span>
            <button @click="setLanguage('en')" :class="currentLang === 'en' ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-white transition-colors'">EN</button>
            <span class="text-slate-600">|</span>
            <button @click="setLanguage('ko')" :class="currentLang === 'ko' ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-white transition-colors'">KO</button>
          </div>

          <!-- WebSocket Live Badge -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <span class="relative flex h-2.5 w-2.5">
              <span
                v-if="wsStatus === 'connected'"
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2.5 w-2.5"
                :class="{
                  'bg-emerald-500': wsStatus === 'connected',
                  'bg-amber-500 animate-pulse': wsStatus === 'connecting',
                  'bg-red-500': wsStatus === 'disconnected'
                }"
              ></span>
            </span>
            <span class="font-bold text-slate-200">
              {{ wsStatus === 'connected' ? t.connected : (wsStatus === 'connecting' ? t.connecting : t.disconnected) }}
            </span>
            <span v-if="wsStatus === 'connected'" class="text-slate-400 border-r border-slate-700 pr-2 mr-1">
              {{ onlineCount }} {{ t.online }}
            </span>
          </div>

          <!-- Chat Button in News Feed Header -->
          <button
            @click="openMessenger()"
            type="button"
            class="relative flex items-center gap-1.5 px-3 h-9 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/60 transition-colors cursor-pointer active:scale-95 text-xs font-extrabold text-emerald-400"
            :title="t.messengerTitle"
            :aria-label="t.messengerTitle"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{{ t.chatShortBtn }}</span>
            <span
              v-if="totalUnreadChatCount > 0"
              class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg ring-2 ring-slate-900 animate-bounce"
            >
              {{ totalUnreadChatCount > 99 ? '99+' : totalUnreadChatCount }}
            </span>
          </button>

          <!-- User Profile Icon in Header -->
          <button
            @click="showProfileModal = true"
            class="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-colors"
            :title="t.profile"
          >
            <img
              v-if="userAvatar"
              :src="userAvatar"
              class="w-full h-full rounded-full object-cover ring-1 ring-emerald-400"
              :alt="t.profile"
            />
            <span v-else class="text-sm text-slate-300">👤</span>
          </button>
        </div>
      </div>
    </header>

    <!-- ============================================== -->
    <!-- MAIN CONTENT VIEWPORT (RESPONSIVE FOR ALL OS) -->
    <!-- ============================================== -->
    <main class="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 flex justify-center">
      
      <!-- Main Feed Container -->
      <div class="w-full max-w-3xl space-y-6">

        <!-- ============================================== -->
        <!-- STORIES BAR (قسم القصص - شريط فيسبوك) -->
        <!-- ============================================== -->
        <div class="bg-slate-900 rounded-3xl border border-slate-800 p-3.5 shadow-xl relative overflow-hidden">
          <div class="flex items-center justify-between mb-3 px-1">
            <div class="flex items-center gap-2">
              <span class="text-emerald-400 font-extrabold text-sm flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{{ t.stories }}</span>
              </span>
              <span class="text-[11px] text-slate-500 font-semibold">({{ stories.length }})</span>
            </div>
          </div>

          <!-- Horizontal Scrollable Container for Story Cards -->
          <div class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
            
            <!-- 1. Create Story Card ("إضافة قصة") -->
            <div
              @click="showCreateStoryModal = true"
              class="snap-start shrink-0 w-28 h-44 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700/80 flex flex-col justify-between p-2.5 cursor-pointer hover:border-emerald-500/80 transition-all hover:scale-[1.03] active:scale-95 group relative overflow-hidden shadow-lg"
            >
              <div class="relative w-full h-24 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                <img v-if="userAvatar" :src="userAvatar" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                <span v-else class="text-2xl text-slate-400">👤</span>
                <div class="absolute inset-0 bg-slate-950/20"></div>
                <div class="absolute bottom-1/2 translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-xl ring-4 ring-slate-900 shadow-xl group-hover:scale-110 transition-transform">
                  +
                </div>
              </div>
              <div class="text-center pt-2">
                <span class="text-[11px] font-bold text-slate-200 block group-hover:text-emerald-400 transition-colors">{{ t.addStory }}</span>
              </div>
            </div>

            <!-- 2. Active Stories List -->
            <div
              v-for="(story, idx) in stories"
              :key="story.id"
              @click="openStoryViewer(idx)"
              class="snap-start shrink-0 w-28 h-44 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between p-2.5 cursor-pointer hover:border-emerald-400 transition-all hover:scale-[1.03] active:scale-95 relative overflow-hidden group shadow-lg ring-1 ring-slate-800 hover:ring-emerald-500/50"
            >
              <!-- Media Background Preview -->
              <div class="absolute inset-0 z-0">
                <video
                  v-if="story.mediaType === 'video'"
                  :src="mediaSrc(story.mediaUrl)"
                  muted
                  playsinline
                  webkit-playsinline="true"
                  preload="metadata"
                  class="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-300"
                ></video>
                <img v-else :src="mediaSrc(story.mediaUrl)" class="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-300" />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/50"></div>
              </div>

              <!-- Author Avatar Badge -->
              <div class="relative z-10 flex items-center justify-between">
                <div class="w-8 h-8 rounded-full bg-slate-900 ring-2 ring-emerald-400 p-0.5 overflow-hidden shadow-md">
                  <img v-if="story.author.avatar" :src="story.author.avatar" class="w-full h-full rounded-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center bg-slate-900 text-[10px] font-black text-emerald-400">
                    {{ story.author.name.charAt(0) }}
                  </div>
                </div>
                <span v-if="story.mediaType === 'video'" class="text-[9px] bg-red-500/90 text-white font-bold px-1.5 py-0.5 rounded-full shadow flex items-center gap-0.5">
                  🎥
                </span>
              </div>

              <!-- Story Title & Caption -->
              <div class="relative z-10 space-y-0.5">
                <span class="text-[10px] font-bold text-white block truncate">{{ story.author.name }}</span>
                <p v-if="story.caption" class="text-[9px] text-slate-300 truncate font-medium opacity-90">{{ story.caption }}</p>
              </div>
            </div>

          </div>
        </div>

        <!-- ============================================== -->
        <!-- SHORT VIDEOS BAR & STREAM (فيديوهات قصيرة) -->
        <!-- ============================================== -->
        <div class="bg-slate-900 rounded-3xl border border-slate-800 p-4 shadow-xl relative overflow-hidden space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 class="text-white font-extrabold text-sm">{{ t.shortVideosTitle }}</h3>
            </div>
            <button
              @click="showCreateShortVideoModal = true"
              class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>+</span>
              <span>{{ t.uploadShortVideoBtn }}</span>
            </button>
          </div>

          <!-- Horizontal Scrollable Container for Short Videos -->
          <div v-if="shortVideos.length > 0" class="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
            <div
              v-for="(sv, idx) in shortVideos"
              :key="sv.id"
              @click="openShortVideoViewer(idx)"
              class="snap-start shrink-0 w-48 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg relative group flex flex-col justify-between cursor-pointer hover:border-emerald-400 transition-all hover:scale-[1.02]"
            >
              <!-- Video Preview Thumbnail (Muted to prevent double audio echo) -->
              <div class="relative w-full h-64 bg-black">
                <video
                  :src="mediaSrc(sv.videoUrl)"
                  muted
                  playsinline
                  preload="metadata"
                  class="w-full h-full object-cover pointer-events-none"
                ></video>
                <div class="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none group-hover:bg-black/10 transition-colors">
                  <div class="w-11 h-11 rounded-full bg-slate-950/75 border border-white/20 flex items-center justify-center text-white shadow-lg">
                    <svg class="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Author, Caption & Private Heart Like Button -->
              <div class="p-3 space-y-2 bg-slate-900/90">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 truncate">
                    <div class="w-6 h-6 rounded-full bg-slate-800 overflow-hidden shrink-0 ring-1 ring-emerald-400">
                      <img v-if="sv.author.avatar" :src="sv.author.avatar" class="w-full h-full object-cover" />
                      <span v-else class="text-[10px] text-emerald-400 font-bold flex items-center justify-center h-full">{{ sv.author.name.charAt(0) }}</span>
                    </div>
                    <span class="text-xs font-bold text-white truncate">{{ sv.author.name }}</span>
                  </div>

                  <!-- Private Heart Like Button (Green / Black - Visible only to user) -->
                  <button
                    @click.stop="togglePrivateShortVideoLike(sv.id)"
                    class="p-1.5 rounded-full transition-all cursor-pointer hover:scale-110 active:scale-95"
                    :title="t.privateLikeTitle"
                  >
                    <svg
                      class="w-5 h-5 transition-colors"
                      :class="isShortVideoLiked(sv.id) ? 'text-black fill-black bg-slate-100 rounded-full p-0.5' : 'text-emerald-400 fill-none'"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                <p v-if="sv.caption" class="text-xs text-slate-300 font-medium line-clamp-2">{{ sv.caption }}</p>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-slate-500 py-3 text-center">
            {{ t.noShortVideosYet }}
          </div>
        </div>

        <!-- ============================================== -->
        <!-- POST COMPOSER (إنشاء المنشور) -->
        <!-- ============================================== -->
        <div class="bg-slate-900 rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-xl relative">
          
          <div class="flex gap-3 items-start mb-3">
            <!-- User Avatar (Clickable to open profile) -->
            <button
              @click="showProfileModal = true"
              type="button"
              class="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-slate-700 hover:ring-emerald-400 transition-all mt-0.5"
              title="فتح الملف الشخصي لتعديل الصورة والاسم"
            >
              <img v-if="userAvatar" :src="userAvatar" alt="صورتي" class="w-full h-full object-cover" />
              <span v-else class="text-base text-slate-300">👤</span>
            </button>

            <!-- Content Textarea -->
            <div class="flex-1">
              <textarea
                v-model="postContent"
                rows="3"
                :placeholder="t.whatsOnYourMind"
                class="w-full bg-slate-950/70 border border-slate-800 focus:border-emerald-500 rounded-2xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all resize-none"
              ></textarea>

              <!-- Profanity Warning Banner -->
              <transition name="slide-fade">
                <div v-if="hasProfanity" class="mt-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{{ profanityWarningText }}</span>
                </div>
              </transition>
            </div>
          </div>

          <!-- Selected Media Preview (From User Device) -->
          <div v-if="selectedMediaType !== 'none'" class="mb-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 relative">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold flex items-center gap-1.5" :class="selectedMediaType === 'video' ? 'text-red-400' : 'text-emerald-400'">
                <span v-if="selectedMediaType === 'video'">{{ t.selectedVideo }} {{ mediaFileName }}</span>
                <span v-else>{{ t.selectedImage }} {{ mediaFileName }}</span>
              </span>
              <button @click="clearMedia" :disabled="isUploadingMedia" class="text-xs text-slate-400 hover:text-red-400 transition-colors p-1 font-bold disabled:opacity-40">
                {{ t.cancelAttachment }}
              </button>
            </div>

            <!-- Video Player Preview -->
            <div v-if="selectedMediaType === 'video'" class="rounded-xl overflow-hidden bg-black max-h-64 flex flex-col items-center justify-center">
              <video :src="mediaUrl" controls playsinline class="max-h-64 w-full object-contain rounded-xl"></video>
            </div>

            <!-- Image Preview -->
            <div v-if="selectedMediaType === 'image'" class="rounded-xl overflow-hidden bg-slate-900 max-h-64 flex flex-col items-center justify-center">
              <img :src="mediaUrl" alt="معاينة الصورة" class="max-h-64 w-full object-cover rounded-xl" />
            </div>

            <!-- Inappropriate Video Warning Banner -->
            <transition name="slide-fade">
              <div v-if="hasInappropriateVideo" class="mt-3 p-3.5 rounded-2xl bg-red-500/20 border border-red-500/60 text-red-400 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-pulse">
                <span class="text-lg shrink-0">🚫</span>
                <span class="leading-relaxed">{{ t.inappropriateVideoWarning }}</span>
              </div>
            </transition>

            <!-- Inappropriate Image Warning Banner -->
            <transition name="slide-fade">
              <div v-if="hasInappropriateImage" class="mt-3 p-3.5 rounded-2xl bg-red-500/20 border border-red-500/60 text-red-400 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-pulse">
                <span class="text-lg shrink-0">🚫</span>
                <span class="leading-relaxed">{{ t.inappropriateImageWarning }}</span>
              </div>
            </transition>

            <!-- Live Upload Progress Bar -->
            <div v-if="isUploadingMedia" class="mt-3 p-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-white">
                <span class="flex items-center gap-2">
                  <span class="animate-spin text-emerald-400">⚡</span>
                  <span v-if="selectedMediaType === 'video'">{{ t.uploadingVideo }}</span>
                  <span v-else>{{ t.uploadingImage }}</span>
                </span>
                <span class="text-emerald-400 font-mono text-sm">{{ uploadProgress }}%</span>
              </div>
              <div class="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  class="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-2.5 rounded-full transition-all duration-150 shadow-lg shadow-emerald-500/20"
                  :style="{ width: `${uploadProgress}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Bar -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-800/80">
            <div class="flex items-center gap-2">
              
              <!-- Red Video Button -->
              <label
                class="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                :class="selectedMediaType === 'video'
                  ? 'bg-red-500 text-white ring-2 ring-red-400'
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50'"
                :title="t.videoBtn"
              >
                <input type="file" accept="video/*" @change="handleDeviceVideoUpload" class="hidden" />
                <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
                <span>{{ t.videoBtn }}</span>
              </label>

              <!-- Green Photo Button -->
              <label
                class="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                :class="selectedMediaType === 'image'
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50'"
                :title="t.photoBtn"
              >
                <input type="file" accept="image/*" @change="handleDeviceImageUpload" class="hidden" />
                <svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <span>{{ t.photoBtn }}</span>
              </label>

            </div>

            <!-- Publish Button -->
            <button
              type="button"
              @click="submitPost"
              :disabled="isPublishing || (!postContent.trim() && !mediaUrl) || hasProfanity || hasInappropriateVideo || hasInappropriateImage"
              class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95"
              :class="hasProfanity || hasInappropriateVideo || hasInappropriateImage || (!postContent.trim() && !mediaUrl)
                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950'"
            >
              <svg v-if="isPublishing" class="animate-spin h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <svg v-else class="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>{{ t.publishBtn }}</span>
            </button>
          </div>
        </div>

        <!-- Real-Time Incoming Notification Toast -->
        <transition name="slide-fade">
          <div
            v-if="newPostAlert"
            @click="scrollToTop"
            class="cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3 rounded-2xl flex items-center justify-between shadow-xl text-xs font-bold mt-4"
          >
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>تم النشر بنجاح</span>
            </div>
            <span>↑ للأعلى</span>
          </div>
        </transition>

        <!-- Real-Time Deletion Notification Toast -->
        <transition name="slide-fade">
          <div
            v-if="deleteAlert"
            class="bg-slate-900/95 text-slate-200 border border-red-500/40 p-3 rounded-2xl flex items-center justify-between shadow-xl text-xs font-semibold mt-3"
          >
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              <span>{{ deleteAlertMessage }}</span>
            </div>
            <button @click="deleteAlert = false" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
        </transition>



        <!-- Empty State (Zero Fake Content) -->
        <div v-if="filteredPosts.length === 0" class="py-14 px-4 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-4 mt-4">
          <div class="w-14 h-14 rounded-3xl bg-slate-800/80 text-emerald-400 mx-auto flex items-center justify-center text-2xl shadow-inner font-mono font-black">
            Γ
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-bold text-white">{{ t.emptyFeedTitle }}</h3>
          </div>
        </div>

        <!-- Feed Stream -->
        <div v-else class="space-y-5 mt-4">
          <article
            v-for="post in filteredPosts"
            :key="post.id"
            class="feed-post-card bg-slate-900 rounded-3xl border border-slate-800/80 overflow-hidden shadow-lg"
          >
            <!-- Post Header -->
            <div class="p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <!-- User Avatar (or Default Badge) -->
                <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden ring-1 ring-slate-700">
                  <img v-if="post.author.avatar" :src="post.author.avatar" class="w-full h-full object-cover" />
                  <span v-else class="text-sm font-black text-emerald-400 font-mono">
                    {{ post.author.name.charAt(0) }}
                  </span>
                </div>
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-sm text-white">{{ post.author.name }}</span>
                    <span class="text-xs text-slate-500">@{{ post.author.handle }}</span>
                  </div>
                  <div class="text-[11px] text-slate-400">{{ post.createdAt }}</div>
                </div>
              </div>

              <!-- Media Tag & Delete Action -->
              <div class="flex items-center gap-2">
                <span
                  v-if="post.mediaType === 'video'"
                  class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  <span>{{ t.videoTag }}</span>
                </span>
                <span
                  v-else-if="post.mediaType === 'image'"
                  class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{{ t.imageTag }}</span>
                </span>

                <button
                  v-if="post.clientId === clientId || post.author.name === userName"
                  @click="requestDeletePost(post)"
                  class="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  :title="t.delete"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Post Text Content -->
            <div v-if="post.content" class="px-5 pb-3 text-sm text-slate-100 leading-relaxed whitespace-pre-line">
              {{ post.content }}
            </div>

            <!-- Post Media (Real User Uploaded Video or Image) -->
            <div v-if="post.mediaType === 'video' && post.mediaUrl" class="bg-black relative">
              <video
                :src="mediaSrc(post.mediaUrl)"
                controls
                preload="metadata"
                playsinline
                @play="onFeedVideoPlay"
                class="w-full max-h-[480px] object-contain bg-black"
              ></video>
            </div>
            <div v-else-if="post.mediaType === 'image' && post.mediaUrl" class="bg-slate-950">
              <img
                :src="mediaSrc(post.mediaUrl)"
                alt="مرفق صورة"
                loading="lazy"
                decoding="async"
                class="w-full max-h-[500px] object-cover cursor-pointer hover:opacity-95"
                @click="modalImageUrl = mediaSrc(post.mediaUrl)"
              />
            </div>

            <!-- Actions Bar: Like, Comments, Share -->
            <div class="px-5 py-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
              <div class="flex items-center gap-4">
                <!-- Private Local Like Button -->
                <button
                  @click="toggleLike(post.id)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all border"
                  :class="post.likedBy && post.likedBy.includes(clientId) 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20' 
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-emerald-400 hover:border-emerald-500/30'"
                  :title="t.like"
                >
                  <svg
                    class="w-4 h-4 transition-transform active:scale-125"
                    :fill="post.likedBy && post.likedBy.includes(clientId) ? 'currentColor' : 'none'"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{{ post.likes }}</span>
                </button>

                <!-- Comments Toggle Button -->
                <button
                  @click="toggleCommentBox(post.id)"
                  class="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{{ post.comments.length }} {{ t.comments }}</span>
                </button>
              </div>

            </div>

            <!-- Comments Drawer -->
            <div v-if="activeCommentPostId === post.id" class="p-4 bg-slate-950/70 border-t border-slate-800 space-y-3">
              <div v-if="post.comments.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
                <div v-for="c in post.comments" :key="c.id" class="text-xs bg-slate-900/80 p-2.5 rounded-xl flex gap-2">
                  <div class="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-emerald-400 font-bold text-[10px]">
                    {{ c.author.charAt(0) }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-slate-200">{{ c.author }}</span>
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] text-slate-500">{{ c.createdAt }}</span>
                        <!-- Comment Action Buttons (Edit & Delete) -->
                        <div v-if="editingCommentId !== c.id && (c.clientId === clientId || c.author === userName)" class="flex items-center gap-2">
                          <button @click="startEditComment(c)" class="text-[10px] text-slate-400 hover:text-emerald-400 font-bold transition-colors">{{ t.edit }}</button>
                          <button @click="deleteComment(post.id, c.id)" class="text-[10px] text-slate-400 hover:text-red-400 font-bold transition-colors">{{ t.delete }}</button>
                        </div>
                      </div>
                    </div>

                    <!-- Normal Text vs Edit Form -->
                    <div v-if="editingCommentId !== c.id">
                      <p class="text-slate-300 mt-0.5 leading-relaxed">{{ c.text }}</p>
                    </div>
                    <div v-else class="mt-2 space-y-2">
                      <textarea
                        v-model="editTextDraft"
                        rows="2"
                        class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2 text-xs text-white focus:outline-none resize-none"
                      ></textarea>
                      <div class="flex items-center gap-2 justify-end">
                        <button
                          @click="saveEditComment(post.id, c.id)"
                          :disabled="!editTextDraft.trim()"
                          class="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold text-[10px] disabled:opacity-40 cursor-pointer"
                        >
                          {{ t.save }}
                        </button>
                        <button
                          @click="cancelEditComment"
                          class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-[10px] cursor-pointer"
                        >
                          {{ t.cancel }}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              <div v-else class="text-xs text-slate-500">{{ t.noComments }}</div>

              <!-- Add Comment Input -->
              <form @submit.prevent="submitComment(post.id)" class="flex gap-2">
                <input
                  v-model="commentDraft"
                  type="text"
                  :placeholder="t.writeComment"
                  class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  :disabled="!commentDraft.trim()"
                  class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 rounded-xl text-slate-950 font-bold text-xs"
                >
                  {{ t.send }}
                </button>
              </form>
            </div>
          </article>
        </div>

      </div>
    </main>

    <!-- Modal for Zooming Images -->
    <div
      v-if="modalImageUrl"
      @click="modalImageUrl = null"
      class="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
    >
      <img :src="modalImageUrl" alt="صورة مكبرة" class="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
    </div>

    <!-- User Profile Modal -->
    <div
      v-if="showProfileModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="font-bold text-white text-base">{{ t.profile }}</h3>
          <button @click="showProfileModal = false" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <!-- Profile Avatar View, Upload & Silent Delete Button -->
        <div class="flex flex-col items-center gap-3">
          <div class="w-20 h-20 rounded-full bg-slate-950 border-2 border-emerald-500/50 flex items-center justify-center overflow-hidden shadow-lg relative group">
            <img v-if="userAvatar" :src="userAvatar" class="w-full h-full object-cover" :alt="t.profile" />
            <span v-else class="text-3xl text-slate-400">👤</span>
          </div>

          <div class="flex items-center justify-center gap-2">
            <!-- زر رفع صورة شخصية في ملف شخصي -->
            <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md">
              <input ref="avatarInputRef" type="file" accept="image/*" @change="handleUserAvatarUpload" class="hidden" />
              <span>{{ t.uploadAvatarBtn }}</span>
            </label>

            <!-- أيقونة حذف صورة الملف الشخصي -->
            <button
              v-if="userAvatar"
              type="button"
              @click="removeUserAvatar"
              :title="t.deleteAvatarBtn"
              :aria-label="t.deleteAvatarBtn"
              class="w-10 h-10 rounded-xl bg-red-500/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 flex items-center justify-center transition-all shadow-md cursor-pointer active:scale-95 shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <span v-if="userAvatar" class="text-[11px] text-emerald-400 font-medium">{{ t.avatarSetSuccess }}</span>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-semibold">{{ t.nameLabel }}</label>
            <input
              v-model="userName"
              type="text"
              class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-semibold">{{ t.usernameLabel }}</label>
            <input
              v-model="userHandle"
              type="text"
              class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        <button
          @click="saveProfileAndClose"
          class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
        >
          {{ t.saveAndClose }}
        </button>
      </div>
    </div>

    <!-- Custom Delete Confirmation Modal -->
    <div
      v-if="postToDelete"
      class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-red-500/30 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl shadow-red-500/10 text-right animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h4 class="font-bold text-white text-base">{{ t.confirmDeletePostTitle }}</h4>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          {{ t.confirmDeletePostDesc }}
        </p>

        <div class="flex gap-2 pt-2">
          <button
            @click="confirmDeletePost"
            class="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer active:scale-95"
          >
            <span>{{ t.confirmDeleteYes }}</span>
          </button>
          <button
            @click="postToDelete = null"
            class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            {{ t.cancel }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal for Creating Story -->
    <div
      v-if="showCreateStoryModal"
      class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
            <h3 class="font-black text-white text-base">{{ t.newStoryTitle }}</h3>
          </div>
          <button @click="showCreateStoryModal = false; clearStoryMedia();" class="text-slate-400 hover:text-white font-bold p-1">✕</button>
        </div>

        <!-- Caption Field -->
        <div>
          <input
            v-model="storyCaption"
            type="text"
            :placeholder="t.storyCaptionPlaceholder"
            class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
          />
        </div>

        <!-- Media Selection Preview -->
        <div v-if="storyMediaUrl || selectedStoryMediaType !== 'none'" class="p-3 rounded-2xl bg-slate-950 border border-slate-800 relative space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold" :class="selectedStoryMediaType === 'video' ? 'text-red-400' : 'text-emerald-400'">
              {{ selectedStoryMediaType === 'video' ? '🎥 ' : '🖼️ ' }} {{ storyFileName || 'Story attachment' }}
            </span>
            <button @click="clearStoryMedia" class="text-xs text-slate-400 hover:text-red-400 font-bold p-1">{{ t.cancelAttachment }}</button>
          </div>

          <div class="max-h-56 rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <video
              v-if="selectedStoryMediaType === 'video'"
              ref="storyPreviewVideoRef"
              :src="storyMediaUrl"
              controls
              playsinline
              preload="auto"
              class="max-h-56 w-full object-contain rounded-xl gpu-video-filter"
              :style="{ filter: getFilterStyle(selectedStoryFilter) }"
            ></video>
            <img v-else :src="storyMediaUrl" alt="Story preview" class="max-h-56 w-full object-cover rounded-xl gpu-video-filter" :style="{ filter: getFilterStyle(selectedStoryFilter) }" />
          </div>

          <!-- Inappropriate Story Video Warning Banner -->
          <transition name="slide-fade">
            <div v-if="hasInappropriateStoryVideo" class="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/60 text-red-400 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-pulse">
              <span class="text-lg shrink-0">🚫</span>
              <span class="leading-relaxed">{{ t.inappropriateVideoWarning }}</span>
            </div>
          </transition>

          <!-- Inappropriate Story Image Warning Banner -->
          <transition name="slide-fade">
            <div v-if="hasInappropriateStoryImage" class="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/60 text-red-400 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-pulse">
              <span class="text-lg shrink-0">🚫</span>
              <span class="leading-relaxed">{{ t.inappropriateImageWarning }}</span>
            </div>
          </transition>
        </div>

        <!-- + Filters Button -->
        <div>
          <button
            @click="openFilterModal"
            type="button"
            class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 text-xs font-bold flex items-center justify-between shadow-md transition-all cursor-pointer group"
          >
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm">+</span>
              <span>{{ t.cinematicFiltersBtn }}</span>
            </div>
            <span class="text-[11px] text-slate-300 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors flex items-center gap-1.5 font-bold">
              <span>{{ storyFilters.find(f => f.id === selectedStoryFilter)?.icon || '✨' }}</span>
              <span>{{ storyFilters.find(f => f.id === selectedStoryFilter)?.name || 'Filter' }}</span>
            </span>
          </button>
        </div>

        <!-- File Pickers -->
        <div class="flex items-center gap-2 pt-1">
          <label class="flex-1 cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all">
            <input type="file" accept="video/*" @change="handleStoryVideoUpload" class="hidden" />
            <span>{{ t.videoFromDevice }}</span>
          </label>
          <label class="flex-1 cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all">
            <input type="file" accept="image/*" @change="handleStoryImageUpload" class="hidden" />
            <span>{{ t.imageFromDevice }}</span>
          </label>
        </div>

        <!-- Publish Story Action -->
        <div class="pt-2 flex gap-2">
          <button
            @click="submitStory"
            :disabled="isPublishingStory || (!storyMediaUrl && !selectedStoryVideoFile && !selectedStoryImageFile) || hasInappropriateStoryVideo || hasInappropriateStoryImage"
            class="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg hover:from-emerald-400 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <svg v-if="isPublishingStory" class="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>{{ t.publishStoryNow }}</span>
          </button>
          <button @click="showCreateStoryModal = false; clearStoryMedia();" class="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer">
            {{ t.cancel }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal for Creating Short Video -->
    <div
      v-if="showCreateShortVideoModal"
      class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
            <h3 class="font-black text-white text-base">{{ t.uploadShortVideoBtn }}</h3>
          </div>
          <button @click="clearShortVideoModal" class="text-slate-400 hover:text-white font-bold p-1">✕</button>
        </div>

        <!-- Video Description / Caption -->
        <div>
          <input
            v-model="shortVideoCaption"
            type="text"
            :placeholder="t.shortVideoCaptionPlaceholder"
            class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
          />
        </div>

        <!-- Selected Video Preview -->
        <div v-if="shortVideoUrl" class="p-3 rounded-2xl bg-slate-950 border border-slate-800 relative space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-red-400 truncate">🎥 {{ shortVideoFileName }}</span>
            <button @click="clearShortVideoModal" class="text-xs text-slate-400 hover:text-red-400 font-bold p-1">{{ t.cancelAttachment }}</button>
          </div>
          <div class="max-h-60 rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <video :src="shortVideoUrl" controls playsinline class="max-h-60 w-full object-contain rounded-xl"></video>
          </div>

          <!-- Checking Short Video Compliance Indicator -->
          <div
            v-if="isCheckingShortVideo"
            class="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 text-xs font-bold flex items-center gap-2"
          >
            <svg class="animate-spin h-3.5 w-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>{{ t.checkingShortVideo }}</span>
          </div>

          <!-- Inappropriate Short Video Warning Banner (Red text asking to change video) -->
          <transition name="slide-fade">
            <div
              v-if="hasInappropriateShortVideo"
              class="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/60 text-red-400 text-xs font-bold space-y-1.5 shadow-xl"
            >
              <div class="flex items-start gap-2">
                <span class="text-base shrink-0">🚫</span>
                <p class="leading-relaxed text-red-400">{{ t.shortVideoInappropriateWarning }}</p>
              </div>
              <p class="text-[11px] text-red-300/90 pr-6">{{ t.changeShortVideoPrompt }}</p>
            </div>
          </transition>

          <!-- Upload Progress -->
          <div v-if="isUploadingShortVideo" class="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-white">
              <span>{{ t.uploadingVideo }}</span>
              <span class="text-emerald-400 font-mono text-sm">{{ shortVideoUploadProgress }}%</span>
            </div>
            <div class="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-150" :style="{ width: `${shortVideoUploadProgress}%` }"></div>
            </div>
          </div>
        </div>

        <!-- File Picker (Switches prompt to Change Video when current video is inappropriate) -->
        <div class="pt-1">
          <label
            class="cursor-pointer flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all shadow-sm border"
            :class="hasInappropriateShortVideo
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/60 ring-1 ring-red-500/40'
              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'"
          >
            <input type="file" accept="video/*" @change="handleShortVideoUpload" class="hidden" />
            <span>{{ hasInappropriateShortVideo ? t.changeVideoFromDevice : t.videoFromDevice }}</span>
          </label>
        </div>

        <!-- Publish Action (Dimmed color & disabled when inappropriate; restored when replaced with suitable video) -->
        <div class="pt-2 flex gap-2">
          <button
            @click="submitShortVideo"
            :disabled="isPublishingShortVideo || isCheckingShortVideo || hasInappropriateShortVideo || !shortVideoUrl"
            class="flex-1 py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2"
            :class="hasInappropriateShortVideo || isCheckingShortVideo || !shortVideoUrl
              ? 'bg-emerald-500/20 text-emerald-200/45 border border-emerald-500/20 opacity-45 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 shadow-lg cursor-pointer active:scale-95'"
          >
            <svg v-if="isPublishingShortVideo" class="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>{{ t.publishShortVideoNow }}</span>
          </button>
          <button @click="clearShortVideoModal" class="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer">
            {{ t.cancel }}
          </button>
        </div>
      </div>
    </div>
    <!-- Modal for Full Screen Reels Viewer (مثل فيسبوك ريلز) -->
    <div
      v-if="activeShortVideoIndex !== null && shortVideos[activeShortVideoIndex]"
      class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="relative w-full max-w-sm h-[88vh] bg-slate-950 rounded-[36px] overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between">
        
        <!-- Background Fullscreen Video Player (Tap anywhere to Pause / Play) -->
        <div
          @click="toggleShortVideoPlayPause"
          class="absolute inset-0 z-0 bg-black flex items-center justify-center cursor-pointer"
        >
          <video
            :key="shortVideos[activeShortVideoIndex].id"
            ref="shortVideoPlayerRef"
            :src="mediaSrc(shortVideos[activeShortVideoIndex].videoUrl)"
            :muted="isShortVideoMuted"
            autoplay
            playsinline
            loop
            @play="isShortVideoPaused = false"
            @pause="isShortVideoPaused = true"
            class="w-full h-full object-cover"
          ></video>
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60 pointer-events-none"></div>

          <!-- Paused Center Indicator -->
          <div
            v-if="isShortVideoPaused"
            class="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div class="w-16 h-16 rounded-full bg-black/60 border border-white/25 flex items-center justify-center text-white shadow-2xl">
              <svg class="w-8 h-8 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Top Header: Author, Mute/Unmute, Delete & Close Button -->
        <div @click.stop class="relative z-20 flex items-center justify-between p-4 bg-slate-950/75 border-b border-slate-800/60">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-full bg-slate-900 ring-2 ring-emerald-400 overflow-hidden shadow-lg">
              <img v-if="shortVideos[activeShortVideoIndex].author.avatar" :src="shortVideos[activeShortVideoIndex].author.avatar" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center font-bold text-emerald-400 text-xs">
                {{ shortVideos[activeShortVideoIndex].author.name.charAt(0) }}
              </div>
            </div>
            <div>
              <span class="font-bold text-xs text-white block">{{ shortVideos[activeShortVideoIndex].author.name }}</span>
              <span class="text-[10px] text-slate-400">@{{ shortVideos[activeShortVideoIndex].author.handle }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Mute / Unmute Toggle Icon Button -->
            <button
              @click.stop="toggleShortVideoMute"
              type="button"
              class="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg border border-slate-700/80 cursor-pointer transition-transform active:scale-95"
              :aria-label="isShortVideoMuted ? 'تشغيل الصوت' : 'كتم الصوت'"
            >
              <!-- Muted Icon -->
              <svg v-if="isShortVideoMuted" class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <!-- Unmuted Sound Icon -->
              <svg v-else class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>

            <!-- Delete Short Video Button (Author Only) -->
            <button
              v-if="shortVideos[activeShortVideoIndex].clientId === clientId || shortVideos[activeShortVideoIndex].author.name === userName"
              @click.stop="requestDeleteShortVideo(shortVideos[activeShortVideoIndex].id)"
              class="px-2.5 py-1.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 shadow-md"
              :title="t.delete"
            >
              <span>🗑️</span>
              <span>{{ t.delete }}</span>
            </button>

            <button @click.stop="closeShortVideoViewer" class="w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white font-bold flex items-center justify-center text-sm shadow-lg border border-slate-700/80 cursor-pointer">
              ✕
            </button>
          </div>
        </div>

        <!-- Bottom Footer: Caption & Private Heart Like Button -->
        <div @click.stop class="relative z-20 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent space-y-3">
          <div class="flex items-end justify-between">
            <div class="space-y-1 flex-1 pr-3">
              <p v-if="shortVideos[activeShortVideoIndex].caption" class="text-xs text-slate-100 leading-relaxed font-medium">
                {{ shortVideos[activeShortVideoIndex].caption }}
              </p>
              <span class="text-[10px] text-emerald-400 font-semibold block">🎬 MAGMA Reels Player</span>
            </div>

            <!-- Private Heart Like Button (Green / Black - Visible only to user) -->
            <button
              @click="togglePrivateShortVideoLike(shortVideos[activeShortVideoIndex].id)"
              class="w-12 h-12 rounded-full bg-slate-900/90 border border-slate-700/80 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
              :title="t.privateLikeTitle"
            >
              <svg
                class="w-6 h-6 transition-colors"
                :class="isShortVideoLiked(shortVideos[activeShortVideoIndex].id) ? 'text-black fill-black bg-white rounded-full p-0.5' : 'text-emerald-400 fill-none'"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          <!-- Comments Section (WebSocket Synced, Delete & Edit without "edited" label) -->
          <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2.5 max-h-40 overflow-y-auto">
            <div class="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-1.5">
              <span>💬 {{ shortVideos[activeShortVideoIndex].comments?.length || 0 }} {{ t.comments }}</span>
            </div>

            <!-- Comments List -->
            <div v-if="shortVideos[activeShortVideoIndex].comments && shortVideos[activeShortVideoIndex].comments.length > 0" class="space-y-2">
              <div v-for="c in shortVideos[activeShortVideoIndex].comments" :key="c.id" class="text-xs bg-slate-950 p-2 rounded-xl flex gap-2">
                <div class="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-emerald-400 font-bold text-[9px]">
                  {{ c.author.charAt(0) }}
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-200">{{ c.author }}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-[9px] text-slate-500">{{ c.createdAt }}</span>
                      <!-- Edit & Delete (if author / client) -->
                      <div v-if="editingShortVideoCommentId !== c.id && (c.clientId === clientId || c.author === userName)" class="flex items-center gap-1.5">
                        <button @click="startEditShortVideoComment(c)" class="text-[9px] text-slate-400 hover:text-emerald-400 font-bold">{{ t.edit }}</button>
                        <button @click="deleteShortVideoComment(shortVideos[activeShortVideoIndex].id, c.id)" class="text-[9px] text-slate-400 hover:text-red-400 font-bold">{{ t.delete }}</button>
                      </div>
                    </div>
                  </div>

                  <!-- Text vs Edit Form -->
                  <div v-if="editingShortVideoCommentId !== c.id">
                    <p class="text-slate-300 mt-0.5 leading-relaxed">{{ c.text }}</p>
                  </div>
                  <div v-else class="mt-1.5 space-y-1.5">
                    <textarea
                      v-model="editShortVideoCommentDraft"
                      rows="2"
                      class="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg p-1.5 text-xs text-white focus:outline-none resize-none"
                    ></textarea>
                    <div class="flex items-center gap-1.5 justify-end">
                      <button
                        @click="saveEditShortVideoComment(shortVideos[activeShortVideoIndex].id, c.id)"
                        :disabled="!editShortVideoCommentDraft.trim()"
                        class="px-2.5 py-0.5 bg-emerald-500 text-slate-950 rounded font-bold text-[9px] disabled:opacity-40"
                      >
                        {{ t.save }}
                      </button>
                      <button @click="cancelEditShortVideoComment" class="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded font-bold text-[9px]">
                        {{ t.cancel }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-[11px] text-slate-500 text-center py-1">{{ t.noComments }}</div>

            <!-- Add Comment Form -->
            <form @submit.prevent="submitShortVideoComment(shortVideos[activeShortVideoIndex].id)" class="flex gap-1.5 pt-1">
              <input
                v-model="shortVideoCommentDraft"
                type="text"
                :placeholder="t.writeComment"
                class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                :disabled="!shortVideoCommentDraft.trim()"
                class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 rounded-xl text-slate-950 font-bold text-xs"
              >
                {{ t.send }}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
    <div
      v-if="activeStoryIndex !== null && stories[activeStoryIndex]"
      class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="relative w-full max-w-sm h-[85vh] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between p-4">
        
        <!-- Top Animated Progress Bar -->
        <div class="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden mb-3">
          <div
            class="bg-gradient-to-r from-emerald-400 to-teal-300 h-1.5 rounded-full transition-all duration-100 ease-linear shadow-md shadow-emerald-500/50"
            :style="{ width: `${storyProgress}%` }"
          ></div>
        </div>

        <!-- Story Top Header (Author & Actions) -->
        <div class="flex items-center justify-between z-20 bg-slate-950/90 p-2 rounded-2xl border border-slate-800/80">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full bg-slate-800 ring-2 ring-emerald-400 overflow-hidden shadow-md">
              <img v-if="stories[activeStoryIndex].author.avatar" :src="stories[activeStoryIndex].author.avatar" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center font-bold text-emerald-400 text-xs">
                {{ stories[activeStoryIndex].author.name.charAt(0) }}
              </div>
            </div>
            <div>
              <span class="font-bold text-xs text-white block">{{ stories[activeStoryIndex].author.name }}</span>
              <span class="text-[10px] text-slate-400">{{ stories[activeStoryIndex].createdAt }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Delete Story Button -->
            <button
              v-if="stories[activeStoryIndex].clientId === clientId || stories[activeStoryIndex].author.name === userName"
              @click="deleteStory(stories[activeStoryIndex].id)"
              class="px-2.5 py-1 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
              :title="t.deleteStoryBtn"
            >
              <span>{{ t.deleteStoryBtn }}</span>
            </button>
            <button @click="closeStoryViewer" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer">
              ✕
            </button>
          </div>
        </div>

        <!-- Story Media Display -->
        <div class="flex-1 my-3 relative rounded-2xl overflow-hidden bg-black flex items-center justify-center">
          <video
            v-if="stories[activeStoryIndex].mediaType === 'video'"
            :key="stories[activeStoryIndex].id"
            ref="storyVideoRef"
            :src="mediaSrc(stories[activeStoryIndex].mediaUrl)"
            preload="auto"
            controls
            playsinline
            @loadstart="isStoryVideoBuffering = true"
            @waiting="isStoryVideoBuffering = true"
            @stalled="isStoryVideoBuffering = true"
            @canplay="onStoryVideoCanPlay"
            @playing="isStoryVideoBuffering = false"
            @timeupdate="onStoryVideoTimeUpdate"
            @ended="onStoryVideoEnded"
            class="w-full h-full object-contain gpu-video-filter"
            :style="{ filter: getSafeFilterStyle(stories[activeStoryIndex].filterStyle || getFilterStyle(stories[activeStoryIndex].filterId || 'normal')) }"
          ></video>
          <img
            v-else
            :src="mediaSrc(stories[activeStoryIndex].mediaUrl)"
            alt="القصة"
            class="w-full h-full object-contain gpu-video-filter"
            :style="{ filter: getSafeFilterStyle(stories[activeStoryIndex].filterStyle || getFilterStyle(stories[activeStoryIndex].filterId || 'normal')) }"
          />

          <!-- Smooth Buffering Indicator for High-Quality Videos -->
          <div
            v-if="isStoryVideoBuffering && stories[activeStoryIndex].mediaType === 'video'"
            class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-black/30"
          >
            <div class="w-10 h-10 rounded-full border-3 border-emerald-400/30 border-t-emerald-400 animate-spin"></div>
          </div>

          <!-- 4K Filter Active Badge Overlay -->
          <div class="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-slate-950/90 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 flex items-center gap-1 shadow-lg pointer-events-none">
            <span>✨</span>
            <span>4K Studio Filter</span>
          </div>

          <!-- Navigation Tap Areas (Previous / Next) -->
          <div @click="prevStory" class="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-start pl-2">
            <span class="text-white/40 text-xl font-bold">‹</span>
          </div>
          <div @click="nextStory" class="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-end pr-2">
            <span class="text-white/40 text-xl font-bold">›</span>
          </div>
        </div>

        <!-- Bottom Story Caption Overlay -->
        <div v-if="stories[activeStoryIndex].caption" class="bg-slate-900/95 border border-slate-800 p-3 rounded-2xl text-xs text-white leading-relaxed text-center shadow-lg z-20">
          {{ stories[activeStoryIndex].caption }}
        </div>

      </div>
    </div>

    <!-- Full 4K Filters Library Modal -->
    <div
      v-if="showFilterModal"
      class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-lg space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 class="font-black text-white text-sm">{{ t.filtersLibraryTitle }}</h3>
          </div>
          <button @click="closeFilterModal" class="text-slate-400 hover:text-white font-bold p-1">✕</button>
        </div>

        <!-- Filters Grid -->
        <div class="flex-1 overflow-y-auto space-y-2.5 pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div
            v-for="filter in storyFilters"
            :key="filter.id"
            @click="selectStoryFilter(filter.id)"
            class="p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group"
            :class="selectedStoryFilter === filter.id
              ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg'
              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'"
          >
            <div class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              <span>{{ filter.icon }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-white truncate group-hover:text-emerald-400 transition-colors">{{ filter.name }}</span>
                <span v-if="selectedStoryFilter === filter.id" class="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-bold">{{ t.filterSelected }}</span>
              </div>
              <p class="text-[10px] text-slate-400 truncate mt-0.5">{{ filter.description }}</p>
            </div>
          </div>
        </div>

        <div class="pt-2 shrink-0 border-t border-slate-800">
          <button
            @click="closeFilterModal"
            class="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            {{ t.filterSelected }}
          </button>
        </div>
      </div>
    </div>

    <!-- Copied Link Toast Alert -->
    <transition name="slide-fade">
      <div
        v-if="copiedAlert"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-5 py-2.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-400"
      >
        <span>✓</span>
        <span>تم نسخ رابط المنشور بنجاح إلى الحافظة!</span>
      </div>
    </transition>

    <!-- ============================================== -->
    <!-- iPhone 18 Pro Max Dynamic Island Notification -->
    <!-- ============================================== -->
    <transition name="slide-fade">
      <div
        v-if="iphoneNotification"
        @click="handleIphoneNotificationClick"
        class="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-[390px] bg-black/95 border border-slate-700/80 rounded-[28px] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/10 cursor-pointer select-none"
      >
        <!-- Dynamic Island Top Sensor Pill -->
        <div class="flex items-center justify-between px-1.5 mb-2">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-bold tracking-wide text-slate-300">iPhone 18 Pro Max</span>
          </div>
          <div class="w-16 h-3 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-end px-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500/80"></span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-emerald-400 font-bold">{{ t.nowLabel }}</span>
            <button
              @click.stop="iphoneNotification = null"
              type="button"
              class="text-slate-400 hover:text-white text-xs font-bold leading-none px-1"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Notification Content -->
        <div class="flex items-center gap-3 px-1">
          <div class="relative shrink-0">
            <div class="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shadow-md">
              <img v-if="iphoneNotification.avatar" :src="iphoneNotification.avatar" class="w-full h-full object-cover" />
              <span v-else class="text-sm font-black text-emerald-400">{{ iphoneNotification.senderName.charAt(0) }}</span>
            </div>
            <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center text-[8px] text-slate-950 font-black">
              💬
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-black text-white truncate">{{ iphoneNotification.senderName }}</span>
              <span class="text-[10px] font-bold text-emerald-400 shrink-0">{{ t.replyNow }}</span>
            </div>
            <p class="text-xs text-slate-300 truncate mt-0.5">{{ iphoneNotification.body }}</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- ============================================== -->
    <!-- CHAT & PEOPLE MODAL (نظام الشات الفوري) -->
    <!-- ============================================== -->
    <div
      v-if="showMessengerModal"
      class="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md h-[84vh] max-h-[680px] flex flex-col overflow-hidden shadow-2xl">
        
        <!-- A. PEOPLE & CHATS DIRECTORY VIEW -->
        <template v-if="!activeChatUser">
          <!-- Directory Header -->
          <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 class="font-black text-white text-sm">{{ t.messengerTitle }}</h3>
                <span class="text-[11px] text-emerald-400 font-semibold">
                  {{ otherChatUsers.filter(u => u.online).length }} {{ t.online }}
                </span>
              </div>
            </div>
            <button
              @click="showMessengerModal = false"
              class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Search People Bar -->
          <div class="p-3 border-b border-slate-800/70 bg-slate-900 shrink-0">
            <input
              v-model="chatUserSearch"
              type="text"
              :placeholder="t.searchPeoplePlaceholder"
              class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <!-- People & Conversations List -->
          <div class="flex-1 overflow-y-auto p-3 space-y-2">
            <div v-if="filteredOtherChatUsers.length === 0" class="py-12 px-4 text-center space-y-2">
              <div class="w-12 h-12 rounded-2xl bg-slate-800/80 text-emerald-400 mx-auto flex items-center justify-center text-xl">
                💬
              </div>
              <p class="text-xs font-bold text-slate-300">{{ t.noPeopleAvailable }}</p>
              <p class="text-[11px] text-slate-500 leading-relaxed">{{ t.noPeopleHint }}</p>
            </div>

            <div
              v-for="person in filteredOtherChatUsers"
              :key="person.clientId"
              class="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-2.5"
            >
              <!-- Person Avatar & Info -->
              <div
                @click="openChatWithUser(person)"
                class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                <div class="relative shrink-0">
                  <div class="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                    <img v-if="person.avatar" :src="person.avatar" class="w-full h-full object-cover" />
                    <span v-else class="text-sm font-black text-emerald-400">{{ person.name.charAt(0) }}</span>
                  </div>
                  <span
                    class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950"
                    :class="person.online ? 'bg-emerald-400' : 'bg-slate-600'"
                  ></span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-xs text-white truncate">{{ person.name }}</span>
                    <span
                      v-if="unreadCounts[person.clientId]"
                      class="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center"
                    >
                      {{ unreadCounts[person.clientId] }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400 truncate mt-0.5">
                    {{ getLastMessagePreview(person.clientId) || `@${person.handle}` }}
                  </p>
                </div>
              </div>

              <!-- Action Buttons: Add Friend + Chat -->
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  @click.stop="addFriend(person)"
                  type="button"
                  :disabled="isFriend(person.clientId)"
                  class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95 border"
                  :class="isFriend(person.clientId)
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 cursor-default'
                    : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border-slate-700'"
                >
                  {{ isFriend(person.clientId) ? t.friendAdded : t.addFriendBtn }}
                </button>

                <button
                  @click.stop="openChatWithUser(person)"
                  type="button"
                  class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 text-[11px] font-extrabold transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  {{ t.openChatBtn }}
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- B. 1-ON-1 MESSENGER CONVERSATION VIEW -->
        <template v-else>
          <!-- Chat Header -->
          <div class="p-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2 shrink-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <button
                @click="activeChatUser = null"
                type="button"
                class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer shrink-0"
                :title="t.backToPeople"
              >
                {{ currentLang === 'ar' ? '→' : '←' }}
              </button>

              <div class="relative shrink-0">
                <div class="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                  <img v-if="activeChatUser.avatar" :src="activeChatUser.avatar" class="w-full h-full object-cover" />
                  <span v-else class="text-xs font-black text-emerald-400">{{ activeChatUser.name.charAt(0) }}</span>
                </div>
                <span
                  class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-950"
                  :class="isUserOnline(activeChatUser.clientId) ? 'bg-emerald-400' : 'bg-slate-600'"
                ></span>
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-xs text-white block truncate">{{ activeChatUser.name }}</span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight border"
                    :class="lockdownMode
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'"
                  >
                    {{ lockdownMode ? '🛡️ LOCKDOWN' : '🔒 E2EE' }}
                  </span>
                </div>
                <span class="text-[10px] font-semibold" :class="isUserOnline(activeChatUser.clientId) ? 'text-emerald-400' : 'text-slate-400'">
                  {{ isUserOnline(activeChatUser.clientId) ? t.onlineNow : t.offlineNow }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click="showCryptoPanel = !showCryptoPanel"
                type="button"
                class="px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer"
                :class="showCryptoPanel || lockdownMode
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'"
                :title="t.e2eeDetailsTitle"
              >
                🛡️
              </button>

              <button
                @click="addFriend(activeChatUser)"
                type="button"
                :disabled="isFriend(activeChatUser.clientId)"
                class="px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer"
                :class="isFriend(activeChatUser.clientId)
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 cursor-default'
                  : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border-slate-700'"
              >
                {{ isFriend(activeChatUser.clientId) ? t.friendAdded : t.addFriendBtn }}
              </button>

              <button
                @click="showMessengerModal = false"
                type="button"
                class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- E2EE Cryptography & GrapheneOS Lockdown Mode Drawer -->
          <div v-if="showCryptoPanel" class="px-3.5 py-3 bg-slate-950/95 border-b border-slate-800 space-y-2.5 text-[11px] shrink-0">
            <div class="flex items-center justify-between gap-2">
              <div>
                <p class="font-extrabold text-emerald-300">{{ t.e2eeDetailsTitle }}</p>
                <p class="text-[10px] text-slate-400">{{ t.e2eeZeroKnowledgeDesc }}</p>
              </div>
              <button
                @click="toggleLockdownMode"
                type="button"
                class="px-2.5 py-1.5 rounded-xl font-extrabold text-[10px] border transition-all cursor-pointer shrink-0"
                :class="lockdownMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-amber-500/50'"
              >
                {{ lockdownMode ? t.lockdownActiveBtn : t.lockdownEnableBtn }}
              </button>
            </div>

            <div class="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 space-y-1.5">
              <div class="flex items-center justify-between text-[10px]">
                <span class="text-slate-400 font-bold">{{ t.safetyNumberLabel }}</span>
                <span :class="activePeerVerified ? 'text-emerald-400' : 'text-amber-400'" class="font-bold">
                  {{ activePeerVerified ? t.verifiedBundleLabel : t.pendingBundleLabel }}
                </span>
              </div>
              <p class="font-mono text-[11px] text-white tracking-wider break-all">{{ activePeerSafetyFingerprint }}</p>
            </div>

            <div class="flex flex-wrap gap-1 text-[9px] font-mono text-slate-300">
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">PQXDH</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">ML-KEM-768</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">SPQR · ML-KEM Braid</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">Triple Ratchet</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">Sealed Sender</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">X25519 · Ed25519 · ECDH</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">AES-256-GCM</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">ChaCha20-Poly1305</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">XSalsa20Poly1305</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">RSA-OAEP · HMAC · HKDF</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">SHA-2 · SHA-3</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">Secure Enclave · TLS</span>
              <span v-if="lockdownMode" class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">GrapheneOS Lockdown</span>
            </div>

            <div class="flex justify-end">
              <button
                @click="rotateAndWipeEnclaveKeys"
                type="button"
                class="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
              >
                🔄 {{ t.rotateKeysBtn }}
              </button>
            </div>
          </div>

          <div v-if="chatSecurityError" class="px-3.5 py-2 bg-red-950/70 border-b border-red-800/70 text-[11px] font-bold text-red-300 shrink-0">
            ⚠️ {{ chatSecurityError }}
          </div>

          <!-- Messages Feed -->
          <div ref="chatMessagesContainerRef" class="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-950/40" :class="{ 'select-none': lockdownMode }">
            <div v-if="activeConversationMessages.length === 0" class="py-14 text-center space-y-2">
              <p class="text-xs font-bold text-slate-400">{{ t.startChatPrompt }}</p>
            </div>

            <div
              v-for="msg in activeConversationMessages"
              :key="msg.id"
              class="flex flex-col"
              :class="msg.senderClientId === clientId ? 'items-end' : 'items-start'"
            >
              <div
                class="max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs space-y-2 shadow-md"
                :class="msg.senderClientId === clientId
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-slate-950 font-medium rounded-br-sm'
                  : 'bg-slate-800/95 text-slate-100 border border-slate-700/70 rounded-bl-sm'"
              >
                <!-- Decrypting Media Placeholder -->
                <div v-if="msg.mediaDecrypting" class="rounded-xl bg-slate-950/80 border border-slate-700/60 px-4 py-6 text-center space-y-1.5">
                  <div class="w-5 h-5 mx-auto border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  <p class="text-[10px] font-bold text-emerald-300">{{ t.decryptingMediaNotice }}</p>
                </div>

                <!-- Chat Video Attachment (E2EE Decrypted Local Blob from HTTPS Ciphertext) -->
                <div v-else-if="msg.mediaType === 'video' && msg.mediaUrl" class="rounded-xl overflow-hidden bg-black" @contextmenu="lockdownMode ? $event.preventDefault() : undefined">
                  <video
                    :src="msg.mediaUrl"
                    controls
                    :controlsList="lockdownMode ? 'nodownload' : undefined"
                    playsinline
                    preload="auto"
                    class="max-h-56 w-full object-contain rounded-xl"
                  ></video>
                </div>

                <!-- Chat Image Attachment (E2EE Decrypted Local Blob from HTTPS Ciphertext) -->
                <div v-else-if="msg.mediaType === 'image' && msg.mediaUrl" class="rounded-xl overflow-hidden bg-slate-950" @contextmenu="lockdownMode ? $event.preventDefault() : undefined">
                  <img
                    :src="msg.mediaUrl"
                    alt="صورة مشفرة"
                    loading="eager"
                    decoding="sync"
                    :draggable="!lockdownMode"
                    @click="modalImageUrl = msg.mediaUrl"
                    class="max-h-56 w-full object-cover rounded-xl cursor-pointer hover:opacity-95"
                  />
                </div>

                <!-- Text Body -->
                <p v-if="msg.text" class="leading-relaxed whitespace-pre-line break-words">{{ msg.text }}</p>

                <div
                  class="text-[9px] font-semibold flex items-center justify-end gap-1 opacity-80"
                  :class="msg.senderClientId === clientId ? 'text-slate-900' : 'text-slate-400'"
                >
                  <span title="E2EE Sealed Sender">🔒</span>
                  <span>{{ msg.createdAt }}</span>
                  <span v-if="msg.senderClientId === clientId">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          <!-- HTTPS Chat Media Upload Progress Bar -->
          <div v-if="isUploadingChatMedia" class="px-3.5 py-2 bg-slate-950 border-t border-slate-800 space-y-1.5 shrink-0">
            <div class="flex items-center justify-between text-[11px] font-bold text-white">
              <span>{{ chatUploadingMediaType === 'video' ? t.uploadingVideo : t.uploadingImage }}</span>
              <span class="text-emerald-400 font-mono">{{ chatUploadProgress }}%</span>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-150" :style="{ width: `${chatUploadProgress}%` }"></div>
            </div>
          </div>

          <!-- Chat Composer (HTTPS Video + HTTPS Photo + Text) -->
          <form @submit.prevent="sendChatTextMessage" class="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2 shrink-0">
            <!-- Send Video via HTTPS Icon -->
            <label
              class="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center cursor-pointer shrink-0 transition-all active:scale-95"
              :class="{ 'opacity-40 pointer-events-none': isUploadingChatMedia }"
              :title="t.sendVideoHttps"
            >
              <input type="file" accept="video/*" @change="handleChatVideoUpload" :disabled="isUploadingChatMedia" class="hidden" />
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </label>

            <!-- Send Photo via HTTPS Icon -->
            <label
              class="w-9 h-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center cursor-pointer shrink-0 transition-all active:scale-95"
              :class="{ 'opacity-40 pointer-events-none': isUploadingChatMedia }"
              :title="t.sendPhotoHttps"
            >
              <input type="file" accept="image/*" @change="handleChatImageUpload" :disabled="isUploadingChatMedia" class="hidden" />
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </label>

            <!-- Message Text Input -->
            <input
              v-model="chatMessageDraft"
              type="text"
              :placeholder="t.writeMessagePlaceholder"
              class="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />

            <!-- Send Button -->
            <button
              type="submit"
              :disabled="!chatMessageDraft.trim() || isUploadingChatMedia"
              class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs cursor-pointer transition-all active:scale-95 shrink-0"
            >
              {{ t.send }}
            </button>
          </form>
        </template>

      </div>
    </div>

  </div>
</template>


<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { magmaE2EE, type PublicKeyBundle, type SealedEnvelope } from './crypto/e2eeEngine';

const RAW_API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const RAW_WS_BASE_URL = (import.meta.env.VITE_WS_URL || '').trim().replace(/\/+$/, '');

function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return RAW_API_BASE_URL ? `${RAW_API_BASE_URL}${normalizedPath}` : normalizedPath;
}

function mediaSrc(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:') || trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/') && RAW_API_BASE_URL) {
    return `${RAW_API_BASE_URL}${trimmed}`;
  }
  return trimmed;
}

function getWebSocketUrl(): string {
  if (RAW_WS_BASE_URL) {
    return RAW_WS_BASE_URL.endsWith('/ws') ? RAW_WS_BASE_URL : `${RAW_WS_BASE_URL}/ws`;
  }
  if (RAW_API_BASE_URL) {
    const wsBase = RAW_API_BASE_URL.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://');
    return `${wsBase}/ws`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export interface Comment {
  id: string;
  clientId?: string;
  author: string;
  avatar: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  clientId?: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  mediaType: 'video' | 'image' | 'none';
  mediaUrl?: string;
  mediaCaption?: string;
  createdAt: string;
  timestamp: number;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  views: number;
}

export interface Story {
  id: string;
  clientId?: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  mediaType: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  filterId?: string;
  filterStyle?: string;
  createdAt: string;
  timestamp: number;
}

export interface ShortVideo {
  id: string;
  clientId?: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  videoUrl: string;
  caption: string;
  createdAt: string;
  timestamp: number;
  comments: Comment[];
}

export interface ChatUser {
  clientId: string;
  name: string;
  handle: string;
  avatar: string;
  online: boolean;
  lastSeen: number;
  e2eeBundle?: PublicKeyBundle;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderClientId: string;
  recipientClientId: string;
  sender: {
    name: string;
    handle: string;
    avatar: string;
  };
  text: string;
  mediaType: 'none' | 'image' | 'video';
  mediaUrl?: string;
  mediaDecrypting?: boolean;
  isE2EE?: boolean;
  ratchetCounter?: number;
  lockdownEnforced?: boolean;
  createdAt: string;
  timestamp: number;
}

function getOrCreateSessionClientId(): string {
  const fallback = 'client-' + Math.random().toString(36).substring(2, 9);
  if (typeof sessionStorage === 'undefined') return fallback;
  const existing = sessionStorage.getItem('magma_session_client_id');
  if (existing) return existing;
  sessionStorage.setItem('magma_session_client_id', fallback);
  return fallback;
}

// Client Unique Session Identifier
const clientId = ref(getOrCreateSessionClientId());

// Multilingual i18n System (Arabic, English, South Korean)
const currentLang = ref<'ar' | 'en' | 'ko'>('ar');

function setLanguage(lang: 'ar' | 'en' | 'ko') {
  currentLang.value = lang;
  if (userName.value === 'مستخدم MAGMA' || userName.value === 'MAGMA User' || userName.value === 'MAGMA 사용자') {
    userName.value = lang === 'en' ? 'MAGMA User' : (lang === 'ko' ? 'MAGMA 사용자' : 'مستخدم MAGMA');
  }
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }
}

function autoDetectDeviceLanguage() {
  if (typeof navigator === 'undefined') return;
  const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
  if (navLang.startsWith('ko')) {
    setLanguage('ko');
  } else if (navLang.startsWith('en')) {
    setLanguage('en');
  } else {
    setLanguage('ar');
  }
}

const i18n = {
  ar: {
    connected: 'متصل',
    connecting: 'اتصال...',
    disconnected: 'منقطع',
    online: 'متصل',
    profile: 'الملف الشخصي',
    stories: 'القصص',
    addStory: 'إضافة قصة',
    whatsOnYourMind: 'ماذا يدور في ذهنك؟ اكتب منشورك وشارك الفيديو أو الصور من جهازك...',
    videoBtn: 'فيديو',
    photoBtn: 'صور من جهازي',
    publishBtn: 'نشر في MAGMA',
    uploadingVideo: 'جاري رفع الفيديو...',
    uploadingImage: 'جاري رفع الصورة...',
    selectedVideo: '🎥 تم اختيار فيديو من جهازك:',
    selectedImage: '🖼️ تم اختيار صورة من جهازك:',
    cancelAttachment: '✕ إلغاء المرفق',
    emptyFeedTitle: 'لا توجد منشورات حتى الآن',
    emptyFeedDesc: '',
    videoTag: 'فيديو',
    imageTag: 'صورة',
    like: 'إعجاب',
    comments: 'تعليق',
    noComments: 'لا توجد تعليقات بعد، كن أول من يعلق!',
    writeComment: 'اكتب تعليقك...',
    send: 'إرسال',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    saveAndClose: 'حفظ وإغلاق',
    nameLabel: 'الاسم',
    usernameLabel: 'اسم المستخدم (المعرف)',
    uploadAvatarBtn: '📷 رفع صورة شخصية من جهازي',
    deleteAvatarBtn: 'حذف صورة الملف الشخصي',
    avatarSetSuccess: 'تم تعيين صورتك الشخصية بنجاح',
    confirmDeletePostTitle: 'تأكيد حذف المنشور',
    confirmDeletePostDesc: 'هل ترغب بالتأكيد في حذف هذا المنشور نهائياً؟ سيتم حذفه فوراً من عندك ومن عند جميع المستخدمين الآخرين المتصلين بالمنصة.',
    confirmDeleteYes: '🗑️ نعم، احذف للجميع الآن',
    newStoryTitle: 'إضافة قصة جديدة (Story)',
    storyCaptionPlaceholder: 'اكتب وصفاً مع القصة...',
    cinematicFiltersBtn: 'فلاتر 4K الاحترافية المتقدمة',
    videoFromDevice: '🎥 فيديو من جهازك',
    imageFromDevice: '🖼️ صورة من جهازك',
    shortVideosTitle: 'فيديوهات قصيرة (Short videos)',
    uploadShortVideoBtn: 'نشر فيديو قصير',
    noShortVideosYet: 'لا توجد فيديوهات قصيرة بعد، كن أول من ينشر!',
    privateLikeTitle: 'إعجاب خاص (مرئي لك فقط)',
    shortVideoCaptionPlaceholder: 'اكتب وصفاً للفيديو القصير...',
    publishShortVideoNow: 'نشر الفيديو القصير الآن',
    publishStoryNow: 'نشر القصة الآن',
    deleteStoryBtn: '🗑️ حذف القصة',
    filtersLibraryTitle: 'مكتبة فلاتر 4K السينمائية الاحترافية',
    filterSelected: 'تم اختيار الفلتر',
    profanityWarning: 'هذا الكلام لا يتوافق مع معايير منصة MAGMA، يرجى تعديل المنشور.',
    inappropriateVideoWarning: 'يحتوي هذا الفيديو على مقاطع غير أخلاقية، يرجى استبداله بمقطع آخر ليتم السماح بالنشر.',
    inappropriateImageWarning: 'هذه الصورة لا تتوافق مع معايير منصة MAGMA يرجى استبدالها.',
    shortVideoInappropriateWarning: 'هذا المحتوى لا يتوافق مع معايير المنصة يرجى استبداله بمحتوى مناسب',
    changeShortVideoPrompt: 'يرجى تغيير الفيديو واختيار فيديو مناسب للمتابعة.',
    changeVideoFromDevice: '🔄 تغيير الفيديو من جهازك',
    checkingShortVideo: 'جاري فحص ملاءمة الفيديو لمعايير المنصة...',
    successPublished: 'تم النشر بنجاح',
    storyPublishedSuccess: 'تم نشر القصة بنجاح',
    storyDeletedSuccess: 'تم حذف القصة بنجاح',
    commentDeletedSuccess: 'تم حذف التعليق بنجاح',
    videoUploadFailed: 'تعذر رفع الفيديو عبر HTTPS، يرجى المحاولة مرة أخرى.',
    copiedLinkSuccess: 'تم نسخ رابط المنشور بنجاح!',
    chatShortBtn: 'شات',
    messengerTitle: 'شات',
    searchPeoplePlaceholder: 'ابحث عن الأشخاص...',
    noPeopleAvailable: 'لا يوجد أشخاص متصلون آخرون حالياً',
    noPeopleHint: 'عند دخول أي شخص للمنصة سيظهر هنا فوراً لإضافته كصديق ومراسلته.',
    addFriendBtn: '+ إضافة صديق',
    friendAdded: '✓ صديق',
    openChatBtn: 'محادثة',
    backToPeople: 'العودة للأشخاص',
    onlineNow: 'متصل الآن',
    offlineNow: 'غير متصل',
    startChatPrompt: 'ابدأ المحادثة الآن! الرسائل والصور والفيديوهات تصل فوراً.',
    writeMessagePlaceholder: 'اكتب رسالة...',
    sendVideoHttps: 'إرسال فيديو عبر HTTPS',
    sendPhotoHttps: 'إرسال صورة عبر HTTPS',
    nowLabel: 'الآن',
    replyNow: 'رد الآن',
    sentPhotoNotice: '📷 أرسل لك صورة',
    sentVideoNotice: '🎥 أرسل لك فيديو',
    addedFriendNotice: '👋 أضافك إلى قائمة الأصدقاء!',
    e2eeDetailsTitle: 'تشفير تام بين الطرفين (E2EE + PQC)',
    e2eeZeroKnowledgeDesc: 'الرسائل والصور والفيديوهات مشفرة بالكامل على جهازك قبل الإرسال ولا يراها أي طرف ثالث.',
    lockdownEnableBtn: 'تفعيل Lockdown Mode',
    lockdownActiveBtn: '🛡️ Lockdown Mode مفعّل',
    safetyNumberLabel: 'بصمة التحقق الأمني (SHA3-512)',
    verifiedBundleLabel: '✓ مفاتيح موثقة Ed25519 + ML-KEM',
    pendingBundleLabel: '⏳ جاري التحقق من المفاتيح',
    rotateKeysBtn: 'تدوير وتصفير مفاتيح Secure Enclave',
    decryptingMediaNotice: 'جاري فك التشفير محلياً (AES-256 / ChaCha20)...',
    lockdownHiddenPreview: '🔒 رسالة مشفرة (Lockdown Mode)'
  },
  en: {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    online: 'online',
    profile: 'Profile',
    stories: 'Stories',
    addStory: 'Add Story',
    whatsOnYourMind: "What's on your mind? Write a post and share video or photos from your device...",
    videoBtn: 'Video',
    photoBtn: 'Photos',
    publishBtn: 'Publish to MAGMA',
    uploadingVideo: 'Uploading video...',
    uploadingImage: 'Uploading photo...',
    selectedVideo: '🎥 Selected video from device:',
    selectedImage: '🖼️ Selected photo from device:',
    cancelAttachment: '✕ Cancel',
    emptyFeedTitle: 'No posts yet',
    emptyFeedDesc: '',
    videoTag: 'Video',
    imageTag: 'Photo',
    like: 'Like',
    comments: 'Comments',
    noComments: 'No comments yet. Be the first to comment!',
    writeComment: 'Write a comment...',
    send: 'Send',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    saveAndClose: 'Save & Close',
    nameLabel: 'Name',
    usernameLabel: 'Username',
    uploadAvatarBtn: '📷 Upload Profile Picture',
    deleteAvatarBtn: 'Delete profile picture',
    avatarSetSuccess: 'Profile picture set successfully',
    confirmDeletePostTitle: 'Confirm Delete Post',
    confirmDeletePostDesc: 'Are you sure you want to permanently delete this post? It will be removed immediately for all connected users.',
    confirmDeleteYes: '🗑️ Yes, delete for everyone',
    newStoryTitle: 'Create New Story',
    storyCaptionPlaceholder: 'Write a story caption...',
    cinematicFiltersBtn: '4K Studio Filters',
    videoFromDevice: '🎥 Video from device',
    imageFromDevice: '🖼️ Image from device',
    shortVideosTitle: 'Short videos',
    uploadShortVideoBtn: 'Upload Short Video',
    noShortVideosYet: 'No short videos yet, be the first!',
    privateLikeTitle: 'Private Like (Visible only to you)',
    shortVideoCaptionPlaceholder: 'Write a description for the short video...',
    publishShortVideoNow: 'Publish Short Video Now',
    publishStoryNow: 'Publish Story Now',
    deleteStoryBtn: '🗑️ Delete Story',
    filtersLibraryTitle: '4K Cinematic Filters Library',
    filterSelected: 'Filter Applied',
    profanityWarning: 'This content violates MAGMA community standards. Please edit your post.',
    inappropriateVideoWarning: 'This video contains inappropriate content. Please replace it with another clip to allow publishing.',
    inappropriateImageWarning: 'This image does not comply with MAGMA platform standards, please replace it.',
    shortVideoInappropriateWarning: 'This content does not comply with platform standards. Please replace it with appropriate content.',
    changeShortVideoPrompt: 'Please change the video and select an appropriate video to continue.',
    changeVideoFromDevice: '🔄 Change video from device',
    checkingShortVideo: 'Checking video compliance with platform standards...',
    successPublished: 'Posted successfully',
    storyPublishedSuccess: 'Story published successfully',
    storyDeletedSuccess: 'Story deleted successfully',
    commentDeletedSuccess: 'Comment deleted successfully',
    videoUploadFailed: 'Failed to upload video via HTTPS, please try again.',
    copiedLinkSuccess: 'Link copied successfully!',
    chatShortBtn: 'Chat',
    messengerTitle: 'Chat',
    searchPeoplePlaceholder: 'Search people...',
    noPeopleAvailable: 'No other users online right now',
    noPeopleHint: 'When others join the platform, they will appear here to add and message.',
    addFriendBtn: '+ Add Friend',
    friendAdded: '✓ Friend',
    openChatBtn: 'Chat',
    backToPeople: 'Back to People',
    onlineNow: 'Online now',
    offlineNow: 'Offline',
    startChatPrompt: 'Say hello! Messages, photos & videos sync instantly.',
    writeMessagePlaceholder: 'Write a message...',
    sendVideoHttps: 'Send video via HTTPS',
    sendPhotoHttps: 'Send photo via HTTPS',
    nowLabel: 'Now',
    replyNow: 'Reply',
    sentPhotoNotice: '📷 Sent you a photo',
    sentVideoNotice: '🎥 Sent you a video',
    addedFriendNotice: '👋 Added you as a friend!',
    e2eeDetailsTitle: 'End-to-End Post-Quantum Encryption',
    e2eeZeroKnowledgeDesc: 'Messages, photos & videos are encrypted on-device before leaving your browser.',
    lockdownEnableBtn: 'Enable Lockdown Mode',
    lockdownActiveBtn: '🛡️ Lockdown Mode Active',
    safetyNumberLabel: 'Safety Number (SHA3-512)',
    verifiedBundleLabel: '✓ Ed25519 + ML-KEM Verified',
    pendingBundleLabel: '⏳ Verifying Keys',
    rotateKeysBtn: 'Rotate & Wipe Secure Enclave Keys',
    decryptingMediaNotice: 'Decrypting locally (AES-256 / ChaCha20)...',
    lockdownHiddenPreview: '🔒 Encrypted message (Lockdown Mode)'
  },
  ko: {
    connected: '연결됨',
    connecting: '연결 중...',
    disconnected: '연결 끊김',
    online: '온라인',
    profile: '프로필',
    stories: '스토리',
    addStory: '스토리 추가',
    whatsOnYourMind: '무슨 생각을 하고 계신가요? 글을 작성하고 동영상이나 사진을 공유하세요...',
    videoBtn: '동영상',
    photoBtn: '사진',
    publishBtn: 'MAGMA에 게시',
    uploadingVideo: '동영상 업로드 중...',
    uploadingImage: '사진 업로드 중...',
    selectedVideo: '🎥 선택한 동영상:',
    selectedImage: '🖼️ 선택한 사진:',
    cancelAttachment: '✕ 취소',
    emptyFeedTitle: '아직 게시물이 없습니다',
    emptyFeedDesc: '',
    videoTag: '비디오',
    imageTag: '사진',
    like: '좋아요',
    comments: '댓글',
    noComments: '아직 댓글이 없습니다. 첫 댓글을 남겨보세요!',
    writeComment: '댓글을 작성하세요...',
    send: '게시',
    edit: '수정',
    delete: '삭제',
    save: '저장',
    cancel: '취소',
    saveAndClose: '저장 및 닫기',
    nameLabel: '이름',
    usernameLabel: '사용자 이름',
    uploadAvatarBtn: '📷 프로필 사진 업로드',
    deleteAvatarBtn: '프로필 사진 삭제',
    avatarSetSuccess: '프로필 사진이 설정되었습니다',
    confirmDeletePostTitle: '게시물 삭제 확인',
    confirmDeletePostDesc: '이 게시물을 정말로 삭제하시겠습니까? 모든 사용자에게 즉시 삭제됩니다.',
    confirmDeleteYes: '🗑️ 예, 지금 삭제합니다',
    newStoryTitle: '새 스토리 만들기',
    storyCaptionPlaceholder: '스토리 캡션을 입력하세요...',
    cinematicFiltersBtn: '4K 시네마틱 스튜디오 필터',
    videoFromDevice: '🎥 동영상 파일',
    imageFromDevice: '🖼️ 이미지 파일',
    shortVideosTitle: 'Short videos',
    uploadShortVideoBtn: '숏 영상 업로드',
    noShortVideosYet: '아직 숏 영상이 없습니다. 첫 영상을 올려보세요!',
    privateLikeTitle: '비공개 좋아요',
    shortVideoCaptionPlaceholder: '숏 영상 설명을 입력하세요...',
    publishShortVideoNow: '지금 숏 영상 게시',
    publishStoryNow: '지금 스토리 게시',
    deleteStoryBtn: '🗑️ 스토리 삭제',
    filtersLibraryTitle: '4K 시네마틱 필터 라이브러리',
    filterSelected: '필터 적용됨',
    profanityWarning: '이 게시물은 MAGMA 커뮤니티 가이드라인을 위반합니다. 수정해 주세요.',
    inappropriateVideoWarning: '이 동영상은 부적절한 내용을 포함하고 있습니다. 게시하려면 다른 동영상으로 교체해 주세요.',
    inappropriateImageWarning: '이 이미지는 MAGMA 플랫폼 표준을 준수하지 않습니다. 교체해 주세요.',
    shortVideoInappropriateWarning: '이 콘텐츠는 플랫폼 기준에 부합하지 않습니다. 적절한 콘텐츠로 교체해 주세요.',
    changeShortVideoPrompt: '계속하려면 동영상을 변경하고 적절한 동영상을 선택해 주세요.',
    changeVideoFromDevice: '🔄 기기에서 동영상 변경',
    checkingShortVideo: '동영상의 플랫폼 기준 적합성을 확인 중입니다...',
    successPublished: '게시되었습니다',
    storyPublishedSuccess: '스토리가 게시되었습니다',
    storyDeletedSuccess: '스토리가 삭제되었습니다',
    commentDeletedSuccess: '댓글이 삭제되었습니다',
    videoUploadFailed: '동영상 업로드 실패, 다시 시도해 주세요.',
    copiedLinkSuccess: '링크가 복사되었습니다!',
    chatShortBtn: '채팅',
    messengerTitle: '채팅',
    searchPeoplePlaceholder: '사람 검색...',
    noPeopleAvailable: '현재 접속 중인 다른 사용자가 없습니다',
    noPeopleHint: '다른 사용자가 접속하면 친구 추가 및 실시간 채팅이 가능합니다.',
    addFriendBtn: '+ 친구 추가',
    friendAdded: '✓ 친구',
    openChatBtn: '채팅',
    backToPeople: '목록으로',
    onlineNow: '온라인',
    offlineNow: '오프라인',
    startChatPrompt: '대화를 시작해 보세요! 메시지와 미디어가 즉시 동기화됩니다.',
    writeMessagePlaceholder: '메시지를 입력하세요...',
    sendVideoHttps: 'HTTPS로 동영상 보내기',
    sendPhotoHttps: 'HTTPS로 사진 보내기',
    nowLabel: '지금',
    replyNow: '답장',
    sentPhotoNotice: '📷 사진을 보냈습니다',
    sentVideoNotice: '🎥 동영상을 보냈습니다',
    addedFriendNotice: '👋 친구로 추가했습니다!',
    e2eeDetailsTitle: '양자 내성 종단간 암호화 (E2EE + PQC)',
    e2eeZeroKnowledgeDesc: '메시지, 사진, 동영상은 기기에서 암호화된 후 전송되며 제3자는 볼 수 없습니다.',
    lockdownEnableBtn: 'Lockdown Mode 켜기',
    lockdownActiveBtn: '🛡️ Lockdown Mode 활성',
    safetyNumberLabel: '보안 확인 번호 (SHA3-512)',
    verifiedBundleLabel: '✓ Ed25519 + ML-KEM 검증됨',
    pendingBundleLabel: '⏳ 키 검증 중',
    rotateKeysBtn: 'Secure Enclave 키 회전 및 초기화',
    decryptingMediaNotice: '로컬 복호화 중 (AES-256 / ChaCha20)...',
    lockdownHiddenPreview: '🔒 암호화된 메시지 (Lockdown Mode)'
  }
};

const t = computed(() => i18n[currentLang.value] || i18n.ar);

// Current User State (Zero Fake Placeholders)
const userName = ref('مستخدم MAGMA');
const userHandle = ref('magma_' + Math.floor(100 + Math.random() * 900));
const userAvatar = ref<string>(''); // Pure real image uploaded by user
const avatarInputRef = ref<HTMLInputElement | null>(null);
const showProfileModal = ref(false);

// Posts & Filtering
const posts = ref<Post[]>([]);
const feedFilter = ref<'all' | 'video' | 'image'>('all');

// Post Creator State
const postContent = ref('');

// Multilingual Profanity Filter (Arabic, English, Korean)
const bannedWords = {
  ar: ['غبي', 'ساقط', 'اهبل', 'تافه', 'حقير', 'كلب', 'حمار', 'متخلف', 'حيوان', 'خنزير', 'قذر', 'منحط', 'حقيرة', 'ساقطة', 'غباء', 'قحبة', 'زفت', 'وسخ'],
  en: ['stupid', 'idiot', 'fool', 'dumb', 'trash', 'bastard', 'asshole', 'bitch', 'shit', 'fuck', 'moron', 'jerk', 'loser', 'scum', 'bullshit', 'douche'],
  ko: ['바보', '멍청이', '개새끼', '씨발', '시발', '병신', '닥쳐', '꺼져', '쓰레기', '미친', '지랄', '존나', '좆', '년', '놈', '새끼']
};

const detectedProfanityLang = computed(() => {
  if (!postContent.value) return null;
  const text = postContent.value.toLowerCase();
  
  if (bannedWords.ar.some(word => text.includes(word.toLowerCase()))) return 'ar';
  if (bannedWords.en.some(word => text.includes(word.toLowerCase()))) return 'en';
  if (bannedWords.ko.some(word => text.includes(word.toLowerCase()))) return 'ko';
  
  return null;
});

const hasProfanity = computed(() => detectedProfanityLang.value !== null);

const profanityWarningText = computed(() => {
  const detected = detectedProfanityLang.value;
  if (detected === 'en') return i18n.en.profanityWarning;
  if (detected === 'ko') return i18n.ko.profanityWarning;
  if (detected === 'ar') return i18n.ar.profanityWarning;
  return t.value.profanityWarning;
});

// Explicit / Inappropriate Content Detection State
const hasInappropriateVideo = ref(false);
const hasInappropriateImage = ref(false);
const hasInappropriateStoryVideo = ref(false);
const hasInappropriateStoryImage = ref(false);

const explicitKeywords = [
  'fap', 'porn', 'sex', 'nude', 'erotic', 'nsfw', '18+', 'adult', 'xvideo',
  'fapadoo', 'signal-2026', 'xxx', 'hentai', 'strip', 'sensual', 'intercourse',
  'explicit', 'lust', 'blowjob', 'boobs', 'penis', 'vagina',
  'bad', 'inappropriate', 'gore', 'violence', 'blood'
];

function isExplicitVideoFile(file: File): boolean {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return explicitKeywords.some(kw => name.includes(kw));
}

function isExplicitImageFile(file: File): boolean {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return explicitKeywords.some(kw => name.includes(kw));
}
const selectedMediaType = ref<'video' | 'image' | 'none'>('none');
const mediaUrl = ref('');
const mediaFileName = ref('');
const selectedVideoFile = ref<File | null>(null);

// Short Videos State
const shortVideos = ref<ShortVideo[]>([]);
const showCreateShortVideoModal = ref(false);
const shortVideoCaption = ref('');
const selectedShortVideoFile = ref<File | null>(null);
const shortVideoUrl = ref('');
const shortVideoFileName = ref('');
const isUploadingShortVideo = ref(false);
const shortVideoUploadProgress = ref(0);
const isPublishingShortVideo = ref(false);
const hasInappropriateShortVideo = ref(false);
const isCheckingShortVideo = ref(false);
let shortVideoModerationToken = 0;
const privateLikedShortVideos = ref<string[]>([]);

function isShortVideoLiked(id: string): boolean {
  return privateLikedShortVideos.value.includes(id);
}

function togglePrivateShortVideoLike(id: string) {
  const index = privateLikedShortVideos.value.indexOf(id);
  if (index === -1) {
    privateLikedShortVideos.value.push(id);
  } else {
    privateLikedShortVideos.value.splice(index, 1);
  }
}

async function extractVideoFrames(file: File, maxFrames = 4): Promise<string[]> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = objectUrl;

    let finished = false;
    const cleanup = () => {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch {
        // ignore
      }
      URL.revokeObjectURL(objectUrl);
    };

    const done = (frames: string[]) => {
      if (finished) return;
      finished = true;
      clearTimeout(safetyTimer);
      cleanup();
      resolve(frames);
    };

    const safetyTimer = setTimeout(() => {
      done([]);
    }, 8000);

    video.onerror = () => done([]);

    video.onloadedmetadata = async () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
      const ratios = duration > 2 ? [0.12, 0.38, 0.65, 0.88] : [0.2, 0.7];
      const timestamps = ratios.slice(0, maxFrames).map((r) => Math.min(duration - 0.05, Math.max(0, duration * r)));

      const canvas = document.createElement('canvas');
      const targetWidth = 360;
      const vw = video.videoWidth || 360;
      const vh = video.videoHeight || 640;
      const scale = Math.min(1, targetWidth / vw);
      canvas.width = Math.max(64, Math.round(vw * scale));
      canvas.height = Math.max(64, Math.round(vh * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        done([]);
        return;
      }

      const frames: string[] = [];
      for (const ts of timestamps) {
        if (finished) break;
        await new Promise<void>((seekResolve) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            try {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push(canvas.toDataURL('image/jpeg', 0.65));
            } catch {
              // ignore frame capture error
            }
            seekResolve();
          };
          video.addEventListener('seeked', onSeeked, { once: true });
          try {
            video.currentTime = ts;
          } catch {
            video.removeEventListener('seeked', onSeeked);
            seekResolve();
          }
          setTimeout(() => {
            video.removeEventListener('seeked', onSeeked);
            seekResolve();
          }, 1500);
        });
      }
      done(frames);
    };
  });
}

async function handleShortVideoUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const currentToken = ++shortVideoModerationToken;

    selectedShortVideoFile.value = file;
    shortVideoFileName.value = file.name;
    hasInappropriateShortVideo.value = false;

    if (shortVideoUrl.value && shortVideoUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(shortVideoUrl.value);
    }
    shortVideoUrl.value = URL.createObjectURL(file);
    target.value = '';

    // Immediate deterministic check for known explicit filenames
    if (isExplicitVideoFile(file)) {
      hasInappropriateShortVideo.value = true;
      isCheckingShortVideo.value = false;
      return;
    }

    // Visual frame content moderation via server-side Gemini Vision API
    isCheckingShortVideo.value = true;
    try {
      const frames = await extractVideoFrames(file);
      if (currentToken !== shortVideoModerationToken) return;

      const res = await fetch(apiUrl('/api/moderate/short-video'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames,
          fileName: file.name,
          caption: shortVideoCaption.value,
        }),
      });

      if (currentToken !== shortVideoModerationToken) return;

      if (res.ok) {
        const data = await res.json();
        hasInappropriateShortVideo.value = data.appropriate === false;
      } else {
        hasInappropriateShortVideo.value = false;
      }
    } catch {
      if (currentToken === shortVideoModerationToken) {
        hasInappropriateShortVideo.value = isExplicitVideoFile(file);
      }
    } finally {
      if (currentToken === shortVideoModerationToken) {
        isCheckingShortVideo.value = false;
      }
    }
  }
}

function clearShortVideoModal() {
  shortVideoModerationToken++;
  if (shortVideoUrl.value && shortVideoUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(shortVideoUrl.value);
  }
  selectedShortVideoFile.value = null;
  shortVideoUrl.value = '';
  shortVideoFileName.value = '';
  shortVideoCaption.value = '';
  hasInappropriateShortVideo.value = false;
  isCheckingShortVideo.value = false;
  isUploadingShortVideo.value = false;
  shortVideoUploadProgress.value = 0;
  isPublishingShortVideo.value = false;
  showCreateShortVideoModal.value = false;
}

async function fetchShortVideos() {
  try {
    const res = await fetch(apiUrl('/api/short-videos'));
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) return;
    const data = await res.json();
    if (data && Array.isArray(data.shortVideos)) {
      shortVideos.value = data.shortVideos;
    }
  } catch (e) {
    // silently continue when backend is unavailable
  }
}

// Short Videos Reels Viewer State & Methods
const activeShortVideoIndex = ref<number | null>(null);
const shortVideoPlayerRef = ref<HTMLVideoElement | null>(null);
const isShortVideoPaused = ref(false);
const isShortVideoMuted = ref(false);

function pauseAllOtherVideos() {
  document.querySelectorAll('video').forEach((v) => {
    if (v !== shortVideoPlayerRef.value && !v.paused) {
      try {
        v.pause();
      } catch (e) {
        // ignore
      }
    }
  });
}

function openShortVideoViewer(index: number) {
  pauseAllOtherVideos();
  isShortVideoPaused.value = false;
  activeShortVideoIndex.value = index;
}

function closeShortVideoViewer() {
  if (shortVideoPlayerRef.value) {
    try {
      shortVideoPlayerRef.value.pause();
      shortVideoPlayerRef.value.currentTime = 0;
    } catch (e) {
      // ignore
    }
  }
  isShortVideoPaused.value = false;
  activeShortVideoIndex.value = null;
}

function toggleShortVideoPlayPause() {
  const video = shortVideoPlayerRef.value;
  if (!video) return;
  if (video.paused) {
    video.play().catch(() => {});
    isShortVideoPaused.value = false;
  } else {
    video.pause();
    isShortVideoPaused.value = true;
  }
}

function toggleShortVideoMute() {
  isShortVideoMuted.value = !isShortVideoMuted.value;
  if (shortVideoPlayerRef.value) {
    shortVideoPlayerRef.value.muted = isShortVideoMuted.value;
  }
}

function requestDeleteShortVideo(shortVideoId: string) {
  const payload = {
    action: 'delete_short_video',
    shortVideoId,
  };
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  } else {
    fetch(apiUrl(`/api/short-videos/${shortVideoId}`), { method: 'DELETE' }).catch(console.error);
  }
  closeShortVideoViewer();
}

async function submitShortVideo() {
  if (hasInappropriateShortVideo.value || isCheckingShortVideo.value) return;
  if (selectedShortVideoFile.value && isExplicitVideoFile(selectedShortVideoFile.value)) {
    hasInappropriateShortVideo.value = true;
    return;
  }
  if (!selectedShortVideoFile.value && !shortVideoUrl.value) return;

  isPublishingShortVideo.value = true;
  let finalVideoUrl = shortVideoUrl.value;

  if (selectedShortVideoFile.value) {
    try {
      isUploadingShortVideo.value = true;
      shortVideoUploadProgress.value = 0;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', apiUrl('/api/upload/video'));
      xhr.setRequestHeader('Content-Type', selectedShortVideoFile.value.type || 'video/mp4');
      xhr.setRequestHeader('X-File-Name', encodeURIComponent(selectedShortVideoFile.value.name));

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          shortVideoUploadProgress.value = Math.round((event.loaded / event.total) * 100);
        }
      };

      finalVideoUrl = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          isUploadingShortVideo.value = false;
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.videoUrl) resolve(res.videoUrl);
              else reject(new Error('Invalid response'));
            } catch (e) { reject(e); }
          } else {
            reject(new Error(`Upload failed status ${xhr.status}`));
          }
        };
        xhr.onerror = () => {
          isUploadingShortVideo.value = false;
          reject(new Error('Network error'));
        };
        xhr.send(selectedShortVideoFile.value);
      });
    } catch (err) {
      isUploadingShortVideo.value = false;
      isPublishingShortVideo.value = false;
      deleteAlertMessage.value = t.value.videoUploadFailed;
      deleteAlert.value = true;
      setTimeout(() => { deleteAlert.value = false; }, 3500);
      return;
    }
  }

  const payload = {
    action: 'create_short_video',
    clientId: clientId.value,
    author: {
      name: userName.value,
      handle: userHandle.value,
      avatar: userAvatar.value || '',
    },
    videoUrl: finalVideoUrl,
    caption: shortVideoCaption.value.trim(),
    fileName: shortVideoFileName.value,
  };

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  } else {
    try {
      const res = await fetch(apiUrl('/api/short-videos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok && data?.code === 'INAPPROPRIATE_CONTENT') {
        hasInappropriateShortVideo.value = true;
        isPublishingShortVideo.value = false;
        return;
      }
      if (data.success && data.shortVideo) {
        if (!shortVideos.value.some(s => s.id === data.shortVideo.id)) {
          shortVideos.value.unshift(data.shortVideo);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  isPublishingShortVideo.value = false;
  clearShortVideoModal();
}

// Short Video Comments State & Methods
const shortVideoCommentDraft = ref('');
const editingShortVideoCommentId = ref<string | null>(null);
const editShortVideoCommentDraft = ref('');

function submitShortVideoComment(shortVideoId: string) {
  if (!shortVideoCommentDraft.value.trim()) return;
  const payload = {
    action: 'add_short_video_comment',
    shortVideoId,
    clientId: clientId.value,
    author: {
      name: userName.value,
      avatar: userAvatar.value || '',
    },
    text: shortVideoCommentDraft.value.trim(),
  };

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
  shortVideoCommentDraft.value = '';
}

function deleteShortVideoComment(shortVideoId: string, commentId: string) {
  const payload = {
    action: 'delete_short_video_comment',
    shortVideoId,
    commentId,
  };
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function startEditShortVideoComment(c: any) {
  editingShortVideoCommentId.value = c.id;
  editShortVideoCommentDraft.value = c.text;
}

function cancelEditShortVideoComment() {
  editingShortVideoCommentId.value = null;
  editShortVideoCommentDraft.value = '';
}

function saveEditShortVideoComment(shortVideoId: string, commentId: string) {
  if (!editShortVideoCommentDraft.value.trim()) return;
  const payload = {
    action: 'update_short_video_comment',
    shortVideoId,
    commentId,
    text: editShortVideoCommentDraft.value.trim(),
  };
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
  cancelEditShortVideoComment();
}
const selectedImageFile = ref<File | null>(null);
const isUploadingMedia = ref(false);
const uploadProgress = ref(0);

const isPublishing = ref(false);
const newPostAlert = ref(false);
const deleteAlert = ref(false);
const deleteAlertMessage = ref('');
const postToDelete = ref<Post | null>(null);
const copiedAlert = ref(false);

// Stories State
const stories = ref<Story[]>([]);
const showCreateStoryModal = ref(false);
const storyCaption = ref('');
const selectedStoryMediaType = ref<'image' | 'video' | 'none'>('none');
const storyMediaUrl = ref('');
const storyFileName = ref('');
const selectedStoryVideoFile = ref<File | null>(null);
const selectedStoryImageFile = ref<File | null>(null);
const isUploadingStory = ref(false);
const storyUploadProgress = ref(0);
const isPublishingStory = ref(false);
const showFilterModal = ref(false);

// 4K Studio Filters Definition (Professional Cinematic Suite - Supported on all OS & browsers)
export interface StoryFilter {
  id: string;
  name: string;
  icon: string;
  style: string;
  description: string;
}

const storyFilters: StoryFilter[] = [
  { id: 'normal', name: 'أصلي (Normal)', icon: '📷', style: '', description: 'بدون تعديل' },
  { id: 'cinematic_pro_4k', name: 'Cinematic Pro 4K', icon: '📱', style: 'contrast(1.22) saturate(1.2) brightness(1.04)', description: 'سينمائي 4K فائق الوضوح مع عمق وتدرج لوني فخم.' },
  { id: 'prores_log', name: 'ProRes Log Studio', icon: '🎥', style: 'contrast(1.3) saturate(1.1) brightness(1.08) sepia(0.08)', description: 'تدرج لوني احترافي بنمط الفيديو السينمائي الخام (ProRes).' },
  { id: 'proraw_vivid', name: 'ProRAW Ultra Vivid', icon: '✨', style: 'saturate(1.4) contrast(1.15) brightness(1.1) sepia(0.05)', description: 'ألوان حية مشبعة بدقة استشعار استثنائية.' },
  { id: 'truetone_portrait', name: 'TrueTone Portrait', icon: '👤', style: 'brightness(1.08) contrast(1.05) saturate(1.1) hue-rotate(-5deg)', description: 'إضاءة بورتريه طبيعية دافئة متوازنة البشرة.' },
  { id: 'golden_hour', name: 'Golden Hour 4K', icon: '🌅', style: 'sepia(0.25) saturate(1.3) contrast(1.1) brightness(1.05)', description: 'تأثير الساعة الذهبية الفاخر للغروب والإضاءة الطبيعية.' },
  { id: 'sunset_glow', name: 'Sunset Glow HDR', icon: '🌇', style: 'saturate(1.35) contrast(1.2) hue-rotate(-10deg) brightness(1.05)', description: 'توهج الغروب المذهل بنطاق ديناميكي واسع.' },
  { id: 'cyberpunk_pro', name: 'Cyberpunk Pro 4K', icon: '🔮', style: 'contrast(1.35) saturate(1.5) hue-rotate(15deg) brightness(1.02)', description: 'ألوان سايبربانك سينمائية عصرية حادة.' },
  { id: 'neon_night', name: 'Neon Night 8K', icon: '⚡', style: 'contrast(1.4) saturate(1.45) brightness(1.06) hue-rotate(20deg)', description: 'إضاءة ليلية نيون عالية الوضوح.' },
  { id: 'studio_noir', name: 'Studio Noir & White', icon: '🎞️', style: 'grayscale(1) contrast(1.4) brightness(1.1)', description: 'أسود وأبيض سينمائي راقي وعميق.' },
  { id: 'vintage_1990', name: 'Vintage 1990 Film', icon: '📽️', style: 'sepia(0.35) contrast(1.2) brightness(0.95) saturate(0.9)', description: 'طابع الفلم الكلاسيكي القديم الدافئ.' },
  { id: 'kodak_portra', name: 'Kodak Portra 400', icon: '📷', style: 'sepia(0.15) saturate(1.15) contrast(1.1) brightness(1.03)', description: 'دفء ألوان كوداك الشهيرة في التصوير الفوتوغرافي.' },
  { id: 'fujifilm_chrome', name: 'Fujifilm Classic Chrome', icon: '📸', style: 'contrast(1.2) saturate(0.95) brightness(1.04) hue-rotate(-8deg)', description: 'طابع فودجي فيلم الكلاسيكي الهادئ.' },
  { id: 'crystal_clarity', name: 'Crystal Clarity HDR', icon: '💎', style: 'contrast(1.28) saturate(1.25) brightness(1.06)', description: 'وضوح بلوري ونطاق ديناميكي فائق.' },
  { id: 'moody_teal', name: 'Moody Teal & Orange', icon: '🌊', style: 'contrast(1.3) saturate(1.3) hue-rotate(-15deg) brightness(0.98)', description: 'التدرج الهوليوودي الشهير (التيل والأورانج).' },
  { id: 'matte_pastel', name: 'Matte Pastel Dream', icon: '☁️', style: 'contrast(0.95) saturate(1.1) brightness(1.12) sepia(0.1)', description: 'تأثير مات باستيل ناعم ومريح للعين.' }
];

const selectedStoryFilter = ref<string>('cinematic_pro_4k');

function getFilterStyle(filterId: string): string {
  const f = storyFilters.find(item => item.id === filterId);
  return f ? f.style : '';
}

// Strip heavy per-frame drop-shadow() from legacy saved filter strings so 4K video stays hardware-accelerated
function getSafeFilterStyle(styleStr: string): string {
  if (!styleStr) return '';
  return styleStr.replace(/drop-shadow\([^)]*\([^)]*\)[^)]*\)|drop-shadow\([^)]*\)/g, '').trim();
}

// Story Viewer State
const activeStoryIndex = ref<number | null>(null);
const storyTimer = ref<any>(null);
const storyProgress = ref(0);

// Comments State
const activeCommentPostId = ref<string | null>(null);
const commentDraft = ref('');
const editingCommentId = ref<string | null>(null);
const editTextDraft = ref('');

// Image Zoom Modal
const modalImageUrl = ref<string | null>(null);

// WebSocket Connection State
const wsStatus = ref<'connecting' | 'connected' | 'disconnected'>('connecting');
const onlineCount = ref<number>(1);
let socket: WebSocket | null = null;
let reconnectTimer: any = null;

// ========================================================
// HTTPS UPLOAD ENGINES (FOR ALL OPERATING SYSTEMS)
// ========================================================

// Upload video strictly via HTTPS stream (Zero WebSocket bloat)
function uploadVideoViaHttps(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    isUploadingMedia.value = true;
    uploadProgress.value = 0;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl('/api/upload/video'));
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        uploadProgress.value = Math.round((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      isUploadingMedia.value = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.videoUrl) {
            resolve(res.videoUrl);
          } else {
            reject(new Error('Invalid server response'));
          }
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`HTTPS upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      isUploadingMedia.value = false;
      reject(new Error('Network error during HTTPS video upload'));
    };

    xhr.send(file);
  });
}

// Upload image via HTTPS
function uploadImageViaHttps(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    isUploadingMedia.value = true;
    uploadProgress.value = 0;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl('/api/upload/image'));
    xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        uploadProgress.value = Math.round((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      isUploadingMedia.value = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.imageUrl) {
            resolve(res.imageUrl);
          } else {
            reject(new Error('Invalid server response'));
          }
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`HTTPS upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      isUploadingMedia.value = false;
      reject(new Error('Network error during HTTPS image upload'));
    };

    xhr.send(file);
  });
}

// ========================================================
// FILE UPLOAD HANDLERS (FROM USER'S REAL DEVICE ONLY)
// ========================================================

// 1. User Avatar / Profile Image Upload & Silent Global Removal
function applySilentAvatarSync(targetClientId: string, newAvatar: string) {
  if (!targetClientId) return;
  const cleanAvatar = typeof newAvatar === 'string' ? newAvatar : '';

  chatUsers.value = chatUsers.value.map((u) =>
    u.clientId === targetClientId ? { ...u, avatar: cleanAvatar } : u
  );
  if (activeChatUser.value?.clientId === targetClientId) {
    activeChatUser.value = { ...activeChatUser.value, avatar: cleanAvatar };
  }

  posts.value.forEach((post) => {
    if (post.clientId === targetClientId) {
      post.author.avatar = cleanAvatar;
    }
    post.comments.forEach((c) => {
      if (c.clientId === targetClientId) {
        c.avatar = cleanAvatar;
      }
    });
  });

  stories.value.forEach((story) => {
    if (story.clientId === targetClientId) {
      story.author.avatar = cleanAvatar;
    }
  });

  shortVideos.value.forEach((sv) => {
    if (sv.clientId === targetClientId) {
      sv.author.avatar = cleanAvatar;
    }
    sv.comments.forEach((c) => {
      if (c.clientId === targetClientId) {
        c.avatar = cleanAvatar;
      }
    });
  });

  let chatUpdated = false;
  chatMessages.value.forEach((msg) => {
    if (msg.senderClientId === targetClientId && msg.sender?.avatar !== cleanAvatar) {
      msg.sender = { ...msg.sender, avatar: cleanAvatar };
      chatUpdated = true;
    }
  });
  if (chatUpdated) {
    magmaE2EE.sealLocalMessages(clientId.value, chatMessages.value);
  }

  if (iphoneNotification.value?.senderClientId === targetClientId) {
    iphoneNotification.value = { ...iphoneNotification.value, avatar: cleanAvatar };
  }
}

function handleUserAvatarUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        userAvatar.value = result;
        applySilentAvatarSync(clientId.value, result);
        registerUserOnSocket();
      }
    };
    reader.readAsDataURL(file);
    target.value = '';
  }
}

function removeUserAvatar() {
  userAvatar.value = '';
  if (avatarInputRef.value) {
    avatarInputRef.value.value = '';
  }
  applySilentAvatarSync(clientId.value, '');

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        action: 'remove_avatar',
        clientId: clientId.value,
      })
    );
  }

  fetch(apiUrl('/api/profile/avatar/remove'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: clientId.value }),
  }).catch(() => {});
}

// 2. Post Video Upload (from user device ONLY - Zero fake videos, 100% HTTPS)
function handleDeviceVideoUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    selectedVideoFile.value = file;
    selectedImageFile.value = null;
    mediaFileName.value = file.name;
    selectedMediaType.value = 'video';
    hasInappropriateVideo.value = isExplicitVideoFile(file);

    // Instant local blob preview with 0 RAM lag
    if (mediaUrl.value && mediaUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl.value);
    }
    mediaUrl.value = URL.createObjectURL(file);
  }
}

// 3. Post Image Upload (from user device ONLY - Zero fake photos)
function handleDeviceImageUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    selectedImageFile.value = file;
    selectedVideoFile.value = null;
    mediaFileName.value = file.name;
    selectedMediaType.value = 'image';
    hasInappropriateVideo.value = false;
    hasInappropriateImage.value = isExplicitImageFile(file);

    if (mediaUrl.value && mediaUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl.value);
    }
    mediaUrl.value = URL.createObjectURL(file);
    target.value = '';
  }
}

function clearMedia() {
  if (mediaUrl.value && mediaUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(mediaUrl.value);
  }
  selectedMediaType.value = 'none';
  mediaUrl.value = '';
  mediaFileName.value = '';
  selectedVideoFile.value = null;
  selectedImageFile.value = null;
  hasInappropriateVideo.value = false;
  hasInappropriateImage.value = false;
  isUploadingMedia.value = false;
  uploadProgress.value = 0;
}

// ========================================================
// STORY MANAGEMENT ENGINES
// ========================================================
function handleStoryVideoUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (storyMediaUrl.value && storyMediaUrl.value.startsWith('blob:') && !stories.value.some((s) => s.mediaUrl === storyMediaUrl.value)) {
      URL.revokeObjectURL(storyMediaUrl.value);
    }
    selectedStoryVideoFile.value = file;
    selectedStoryImageFile.value = null;
    storyFileName.value = file.name;
    selectedStoryMediaType.value = 'video';
    hasInappropriateStoryVideo.value = isExplicitVideoFile(file);
    storyMediaUrl.value = URL.createObjectURL(file);
    target.value = '';
  }
}

function handleStoryImageUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (storyMediaUrl.value && storyMediaUrl.value.startsWith('blob:') && !stories.value.some((s) => s.mediaUrl === storyMediaUrl.value)) {
      URL.revokeObjectURL(storyMediaUrl.value);
    }
    selectedStoryImageFile.value = file;
    selectedStoryVideoFile.value = null;
    storyFileName.value = file.name;
    selectedStoryMediaType.value = 'image';
    hasInappropriateStoryVideo.value = false;
    hasInappropriateStoryImage.value = isExplicitImageFile(file);
    storyMediaUrl.value = URL.createObjectURL(file);
    target.value = '';
  }
}

function clearStoryMedia() {
  if (storyMediaUrl.value && storyMediaUrl.value.startsWith('blob:') && !stories.value.some((s) => s.mediaUrl === storyMediaUrl.value)) {
    URL.revokeObjectURL(storyMediaUrl.value);
  }
  selectedStoryMediaType.value = 'none';
  storyMediaUrl.value = '';
  storyFileName.value = '';
  selectedStoryVideoFile.value = null;
  selectedStoryImageFile.value = null;
  hasInappropriateStoryVideo.value = false;
  hasInappropriateStoryImage.value = false;
  storyCaption.value = '';
  isUploadingStory.value = false;
  storyUploadProgress.value = 0;
}

const storyPreviewVideoRef = ref<HTMLVideoElement | null>(null);
const wasStoryPreviewPlaying = ref(false);

function openFilterModal() {
  if (storyPreviewVideoRef.value && !storyPreviewVideoRef.value.paused) {
    wasStoryPreviewPlaying.value = true;
    storyPreviewVideoRef.value.pause();
  } else {
    wasStoryPreviewPlaying.value = false;
  }
  showFilterModal.value = true;
}

function closeFilterModal() {
  showFilterModal.value = false;
  if (wasStoryPreviewPlaying.value) {
    wasStoryPreviewPlaying.value = false;
    requestAnimationFrame(() => {
      storyPreviewVideoRef.value?.play().catch(() => {});
    });
  }
}

function selectStoryFilter(filterId: string) {
  selectedStoryFilter.value = filterId;
  closeFilterModal();
}

async function submitStory() {
  if (hasInappropriateStoryVideo.value || hasInappropriateStoryImage.value) return;
  if (!storyMediaUrl.value && !selectedStoryVideoFile.value && !selectedStoryImageFile.value) return;

  const currentMediaUrl = storyMediaUrl.value;
  const currentMediaType = selectedStoryMediaType.value;
  const currentCaption = storyCaption.value.trim();
  const videoFile = selectedStoryVideoFile.value;
  const imageFile = selectedStoryImageFile.value;

  const storyId = `story-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const filterIdVal = selectedStoryFilter.value;
  const filterStyleVal = getFilterStyle(filterIdVal);

  const newStory: Story = {
    id: storyId,
    clientId: clientId.value,
    author: {
      name: userName.value,
      handle: userHandle.value,
      avatar: userAvatar.value || '',
    },
    mediaType: currentMediaType === 'none' ? (videoFile ? 'video' : 'image') : currentMediaType,
    mediaUrl: currentMediaUrl,
    caption: currentCaption,
    filterId: filterIdVal,
    filterStyle: filterStyleVal,
    createdAt: 'الآن',
    timestamp: Date.now(),
  };

  // 1. Instant Optimistic UI insert with strict deduplication
  const existingIdx = stories.value.findIndex((s) => s.id === storyId);
  if (existingIdx !== -1) {
    stories.value[existingIdx] = newStory;
  } else {
    stories.value.unshift(newStory);
  }

  // Close modal and reset form
  showCreateStoryModal.value = false;
  selectedStoryMediaType.value = 'none';
  storyMediaUrl.value = '';
  storyFileName.value = '';
  selectedStoryVideoFile.value = null;
  selectedStoryImageFile.value = null;
  storyCaption.value = '';

  deleteAlertMessage.value = 'تم نشر القصة بنجاح';
  deleteAlert.value = true;
  setTimeout(() => { deleteAlert.value = false; }, 3000);

  // 2. Background HTTPS Upload & Real-time Sync
  try {
    let finalMediaUrl = currentMediaUrl;
    if (currentMediaType === 'video' && videoFile) {
      finalMediaUrl = await uploadVideoViaHttps(videoFile);
    } else if (currentMediaType === 'image' && imageFile) {
      finalMediaUrl = await uploadImageViaHttps(imageFile);
    }

    // Keep instant local blob URL on the sender's session if already local so high-res playback never stalls/restarts mid-play
    if (!currentMediaUrl.startsWith('blob:')) {
      newStory.mediaUrl = finalMediaUrl;
    }

    const payload = {
      id: storyId,
      clientId: clientId.value,
      author: newStory.author,
      mediaType: newStory.mediaType,
      mediaUrl: finalMediaUrl,
      caption: currentCaption,
      filterId: filterIdVal,
      filterStyle: filterStyleVal,
    };

    const res = await fetch(apiUrl('/api/stories'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      sendSocketAction('create_story', payload);
    }
  } catch (err: any) {
    console.error('Background HTTPS Story Upload Error:', err);
  } finally {
    isPublishingStory.value = false;
  }
}

const storyVideoRef = ref<HTMLVideoElement | null>(null);
const isStoryVideoBuffering = ref(false);

function stopStoryVideo() {
  isStoryVideoBuffering.value = false;
  if (storyVideoRef.value) {
    try {
      storyVideoRef.value.pause();
      storyVideoRef.value.currentTime = 0;
    } catch (e) {
      // ignore
    }
  }
}

function openStoryViewer(index: number) {
  stopStoryVideo();
  const target = stories.value[index];
  isStoryVideoBuffering.value = target?.mediaType === 'video';
  activeStoryIndex.value = index;
  startStoryTimer();
}

function closeStoryViewer() {
  stopStoryVideo();
  activeStoryIndex.value = null;
  if (storyTimer.value) clearInterval(storyTimer.value);
}

function nextStory() {
  stopStoryVideo();
  if (activeStoryIndex.value !== null && activeStoryIndex.value < stories.value.length - 1) {
    const nextIdx = activeStoryIndex.value + 1;
    isStoryVideoBuffering.value = stories.value[nextIdx]?.mediaType === 'video';
    activeStoryIndex.value = nextIdx;
    startStoryTimer();
  } else {
    closeStoryViewer();
  }
}

function prevStory() {
  stopStoryVideo();
  if (activeStoryIndex.value !== null && activeStoryIndex.value > 0) {
    const prevIdx = activeStoryIndex.value - 1;
    isStoryVideoBuffering.value = stories.value[prevIdx]?.mediaType === 'video';
    activeStoryIndex.value = prevIdx;
    startStoryTimer();
  }
}

function onStoryVideoTimeUpdate(e: Event) {
  const video = e.target as HTMLVideoElement;
  if (video && video.duration && !isNaN(video.duration) && video.duration > 0) {
    storyProgress.value = (video.currentTime / video.duration) * 100;
  }
}

function onStoryVideoEnded() {
  storyProgress.value = 100;
  nextStory();
}

function onStoryVideoCanPlay(e: Event) {
  isStoryVideoBuffering.value = false;
  const video = e.target as HTMLVideoElement;
  if (video && video.paused && activeStoryIndex.value !== null) {
    video.play().catch(() => {});
  }
}

function startStoryTimer() {
  if (storyTimer.value) clearInterval(storyTimer.value);
  storyProgress.value = 0;
  const currentStory = stories.value[activeStoryIndex.value ?? 0];
  if (!currentStory) return;

  // For video stories: playback duration and transition are driven dynamically by the video's @timeupdate and @ended events
  if (currentStory.mediaType === 'video') {
    return;
  }

  // For image stories: 5-second clean timer
  const duration = 5000;
  const interval = 100;
  const step = (interval / duration) * 100;

  storyTimer.value = setInterval(() => {
    storyProgress.value += step;
    if (storyProgress.value >= 100) {
      nextStory();
    }
  }, interval);
}

async function deleteStory(storyId: string) {
  stopStoryVideo();
  sendSocketAction('delete_story', { storyId });
  try {
    await fetch(apiUrl(`/api/stories/${storyId}`), { method: 'DELETE' });
  } catch (e) {
    // fallback
  }
  closeStoryViewer();
  deleteAlertMessage.value = 'تم حذف القصة بنجاح';
  deleteAlert.value = true;
  setTimeout(() => { deleteAlert.value = false; }, 3000);
}


// ========================================================
// WEBSOCKET LOGIC
// ========================================================
async function connectWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  wsStatus.value = 'connecting';

  try {
    const healthRes = await fetch(apiUrl('/api/health'));
    const contentType = healthRes.headers.get('content-type') || '';
    if (!healthRes.ok || !contentType.includes('application/json')) {
      wsStatus.value = 'disconnected';
      return;
    }
  } catch {
    wsStatus.value = 'disconnected';
    return;
  }

  const wsUrl = getWebSocketUrl();

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      wsStatus.value = 'connected';
      registerUserOnSocket();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSocketEvent(data);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    socket.onclose = () => {
      wsStatus.value = 'disconnected';
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connectWebSocket, 2000);
    };

    socket.onerror = () => {
      wsStatus.value = 'disconnected';
    };
  } catch (err) {
    wsStatus.value = 'disconnected';
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectWebSocket, 3000);
  }
}

// ========================================================
// REAL-TIME MESSENGER & iPHONE 18 PRO MAX NOTIFICATIONS
// ========================================================
const showMessengerModal = ref(false);
const chatUsers = ref<ChatUser[]>([]);
const friendIds = ref<string[]>([]);
const chatMessages = ref<ChatMessage[]>([]);
const activeChatUser = ref<ChatUser | null>(null);
const chatUserSearch = ref('');
const chatMessageDraft = ref('');
const unreadCounts = reactive<Record<string, number>>({});
const isUploadingChatMedia = ref(false);
const chatUploadingMediaType = ref<'image' | 'video'>('image');
const chatUploadProgress = ref(0);
const chatMessagesContainerRef = ref<HTMLElement | null>(null);

interface IphoneNotificationPayload {
  senderClientId: string;
  senderName: string;
  senderHandle: string;
  avatar: string;
  body: string;
}

const iphoneNotification = ref<IphoneNotificationPayload | null>(null);
let iphoneNotificationTimer: any = null;

const otherChatUsers = computed(() => {
  return chatUsers.value.filter((u) => u.clientId !== clientId.value);
});

const filteredOtherChatUsers = computed(() => {
  const q = chatUserSearch.value.trim().toLowerCase();
  if (!q) return otherChatUsers.value;
  return otherChatUsers.value.filter(
    (u) => u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q)
  );
});

const totalUnreadChatCount = computed(() => {
  return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
});

const activeConversationMessages = computed(() => {
  if (!activeChatUser.value) return [];
  const targetId = activeChatUser.value.clientId;
  return chatMessages.value.filter(
    (m) =>
      (m.senderClientId === clientId.value && m.recipientClientId === targetId) ||
      (m.senderClientId === targetId && m.recipientClientId === clientId.value)
  );
});

function isUserOnline(targetClientId: string): boolean {
  const found = chatUsers.value.find((u) => u.clientId === targetClientId);
  return Boolean(found?.online);
}

function isFriend(targetClientId: string): boolean {
  return friendIds.value.includes(targetClientId);
}

const showCryptoPanel = ref(false);
const lockdownMode = ref(false);
const chatSecurityError = ref('');
const myE2EEBundle = ref<PublicKeyBundle | null>(null);
const peerBundlesCache = reactive<Record<string, PublicKeyBundle>>({});
const decryptedMediaUrls = new Set<string>();
let e2eeInitPromise: Promise<PublicKeyBundle> | null = null;

async function ensureE2EEInitialized(): Promise<PublicKeyBundle> {
  if (myE2EEBundle.value) return myE2EEBundle.value;
  if (!e2eeInitPromise) {
    e2eeInitPromise = magmaE2EE.initForClient(clientId.value).then(async (bundle) => {
      myE2EEBundle.value = bundle;
      const saved = await magmaE2EE.unsealLocalMessages<ChatMessage>(clientId.value);
      saved.forEach((m) => {
        if (!chatMessages.value.some((existing) => existing.id === m.id)) {
          // Do not restore stale blob: media across sessions
          const safeMediaUrl = m.mediaUrl?.startsWith('blob:') ? '' : m.mediaUrl;
          chatMessages.value.push({ ...m, mediaUrl: safeMediaUrl });
        }
      });
      return bundle;
    });
  }
  return e2eeInitPromise;
}

async function resolvePeerBundle(peerClientId: string): Promise<PublicKeyBundle | null> {
  const fromUsers = chatUsers.value.find((u) => u.clientId === peerClientId)?.e2eeBundle;
  if (fromUsers) {
    peerBundlesCache[peerClientId] = fromUsers;
    return fromUsers;
  }
  if (peerBundlesCache[peerClientId]) return peerBundlesCache[peerClientId];
  try {
    const res = await fetch(apiUrl(`/api/chat/keys/${encodeURIComponent(peerClientId)}`));
    if (res.ok) {
      const data = await res.json();
      if (data?.e2eeBundle) {
        peerBundlesCache[peerClientId] = data.e2eeBundle;
        return data.e2eeBundle;
      }
    }
  } catch {
    // ignore fetch error
  }
  return null;
}

const activePeerVerified = computed(() => {
  if (!activeChatUser.value) return false;
  const bundle = activeChatUser.value.e2eeBundle || peerBundlesCache[activeChatUser.value.clientId];
  return bundle ? magmaE2EE.verifyPublicKeyBundle(bundle) : false;
});

const activePeerSafetyFingerprint = computed(() => {
  if (!activeChatUser.value) return '---- ---- ---- ----';
  const bundle = activeChatUser.value.e2eeBundle || peerBundlesCache[activeChatUser.value.clientId];
  if (!bundle) return '---- ---- ---- ----';
  return magmaE2EE.computeSafetyFingerprint(bundle);
});

function toggleLockdownMode() {
  lockdownMode.value = !lockdownMode.value;
  chatSecurityError.value = '';
  if (lockdownMode.value) {
    // Clear any leftover clipboard/selection & ephemeral media caches if desired on next exit
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      // ignore
    }
  }
}

async function rotateAndWipeEnclaveKeys() {
  decryptedMediaUrls.forEach((u) => URL.revokeObjectURL(u));
  decryptedMediaUrls.clear();
  chatMessages.value = [];
  myE2EEBundle.value = null;
  e2eeInitPromise = null;
  await magmaE2EE.wipeEnclave(clientId.value);
  await ensureE2EEInitialized();
  await registerUserOnSocket();
}

function getLastMessagePreview(targetClientId: string): string {
  if (lockdownMode.value) return t.value.lockdownHiddenPreview;
  const msgs = chatMessages.value.filter(
    (m) =>
      (m.senderClientId === clientId.value && m.recipientClientId === targetClientId) ||
      (m.senderClientId === targetClientId && m.recipientClientId === clientId.value)
  );
  const last = msgs[msgs.length - 1];
  if (!last) return '';
  if (last.mediaType === 'video') return '🎥 فيديو مشفر';
  if (last.mediaType === 'image') return '📷 صورة مشفرة';
  return last.text;
}

function scrollChatToBottom() {
  nextTick(() => {
    if (chatMessagesContainerRef.value) {
      chatMessagesContainerRef.value.scrollTop = chatMessagesContainerRef.value.scrollHeight;
    }
  });
}

async function registerUserOnSocket() {
  const bundle = await ensureE2EEInitialized();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        action: 'register_user',
        clientId: clientId.value,
        name: userName.value,
        handle: userHandle.value,
        avatar: userAvatar.value || '',
        e2eeBundle: bundle,
      })
    );
  }
}

function saveProfileAndClose() {
  showProfileModal.value = false;
  registerUserOnSocket();
}

function openMessenger() {
  showMessengerModal.value = true;
  chatSecurityError.value = '';
  registerUserOnSocket();
  if (activeChatUser.value) {
    unreadCounts[activeChatUser.value.clientId] = 0;
    scrollChatToBottom();
  }
}

function openChatWithUser(person: ChatUser) {
  activeChatUser.value = person;
  chatSecurityError.value = '';
  unreadCounts[person.clientId] = 0;
  if (person.e2eeBundle) {
    peerBundlesCache[person.clientId] = person.e2eeBundle;
  } else {
    resolvePeerBundle(person.clientId);
  }
  scrollChatToBottom();
}

function addFriend(person: ChatUser) {
  if (!person.clientId || isFriend(person.clientId)) return;
  friendIds.value.push(person.clientId);
  sendSocketAction('add_friend', {
    clientId: clientId.value,
    targetClientId: person.clientId,
    sender: {
      clientId: clientId.value,
      name: userName.value,
      handle: userHandle.value,
      avatar: userAvatar.value || '',
    },
  });
}

function triggerIphoneNotification(payload: IphoneNotificationPayload) {
  iphoneNotification.value = payload;
  if (iphoneNotificationTimer) clearTimeout(iphoneNotificationTimer);
  iphoneNotificationTimer = setTimeout(() => {
    iphoneNotification.value = null;
  }, 5000);
}

function handleIphoneNotificationClick() {
  if (!iphoneNotification.value) return;
  const targetId = iphoneNotification.value.senderClientId;
  const person: ChatUser = chatUsers.value.find((u) => u.clientId === targetId) || {
    clientId: targetId,
    name: iphoneNotification.value.senderName,
    handle: iphoneNotification.value.senderHandle,
    avatar: iphoneNotification.value.avatar,
    online: true,
    lastSeen: Date.now(),
  };
  iphoneNotification.value = null;
  showMessengerModal.value = true;
  openChatWithUser(person);
}

function onFeedVideoPlay(e: Event) {
  const current = e.target as HTMLVideoElement;
  document.querySelectorAll('video').forEach((v) => {
    if (v !== current && !v.paused) {
      try {
        v.pause();
      } catch {
        // ignore
      }
    }
  });
}

function isValidHttpsChatMediaUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('http://')) {
    return false;
  }
  return trimmed.startsWith('/uploads/') || trimmed.startsWith('https://');
}

async function dispatchChatMessage(
  text: string,
  mediaType: 'none' | 'image' | 'video',
  mediaMeta?: {
    mediaUrl: string;
    mediaKeyB64: string;
    mediaIvB64: string;
    mediaChaChaKeyB64?: string;
    mediaChaChaNonceB64?: string;
    mediaCipherMode: 'AES256-CHACHA20' | 'AES256-GCM';
    mediaMimeType: string;
    mediaSha3Digest: string;
  },
  explicitRecipientId?: string,
  existingMsgId?: string
) {
  const recipientId = explicitRecipientId || activeChatUser.value?.clientId;
  if (!recipientId) return;
  chatSecurityError.value = '';

  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (window.location.protocol !== 'https:' && !isLocalDev) {
    chatSecurityError.value = 'يتطلب الإرسال اتصال HTTPS / WSS مشفر لحماية الخصوصية';
    throw new Error('Insecure transport blocked');
  }

  const cleanMediaUrl = (mediaMeta?.mediaUrl || '').trim();
  if ((mediaType === 'image' || mediaType === 'video') && !isValidHttpsChatMediaUrl(cleanMediaUrl)) {
    throw new Error('Encrypted chat media must be uploaded strictly via HTTPS');
  }

  await ensureE2EEInitialized();
  const peerBundle = await resolvePeerBundle(recipientId);
  if (!peerBundle) {
    chatSecurityError.value = 'بانتظار مفاتيح التشفير للطرف الآخر (PQXDH / ML-KEM)...';
    throw new Error('Peer E2EE key bundle unavailable');
  }

  const msgId = existingMsgId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const ts = Date.now();

  const senderInfo = {
    name: userName.value,
    handle: userHandle.value,
    avatar: userAvatar.value || '',
  };

  if (!chatMessages.value.some((m) => m.id === msgId)) {
    chatMessages.value.push({
      id: msgId,
      conversationId: [clientId.value, recipientId].sort().join('--'),
      senderClientId: clientId.value,
      recipientClientId: recipientId,
      sender: senderInfo,
      text: text.trim(),
      mediaType,
      mediaUrl: cleanMediaUrl,
      isE2EE: true,
      lockdownEnforced: lockdownMode.value,
      createdAt: timeStr,
      timestamp: ts,
    });
    scrollChatToBottom();
  }

  try {
    const sealedEnvelope = await magmaE2EE.sealAndEncryptMessage(
      {
        id: msgId,
        senderClientId: clientId.value,
        recipientClientId: recipientId,
        sender: senderInfo,
        text: text.trim(),
        mediaType,
        mediaUrl: cleanMediaUrl,
        mediaKeyB64: mediaMeta?.mediaKeyB64,
        mediaIvB64: mediaMeta?.mediaIvB64,
        mediaChaChaKeyB64: mediaMeta?.mediaChaChaKeyB64,
        mediaChaChaNonceB64: mediaMeta?.mediaChaChaNonceB64,
        mediaCipherMode: mediaMeta?.mediaCipherMode,
        mediaMimeType: mediaMeta?.mediaMimeType,
        mediaSha3Digest: mediaMeta?.mediaSha3Digest,
        lockdownEnforced: lockdownMode.value,
        createdAt: timeStr,
        timestamp: ts,
      },
      peerBundle,
      lockdownMode.value
    );

    const sealedPayload = {
      id: msgId,
      recipientClientId: recipientId,
      sealedEnvelope,
      timestamp: ts,
    };

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'send_sealed_chat', ...sealedPayload }));
    } else {
      await fetch(apiUrl('/api/chat/sealed'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sealedPayload),
      });
    }

    magmaE2EE.sealLocalMessages(clientId.value, chatMessages.value);
  } catch (err: any) {
    chatSecurityError.value = err?.message || 'فشل التشفير بين الطرفين';
    chatMessages.value = chatMessages.value.filter((m) => m.id !== msgId);
    throw err;
  }
}

function sendChatTextMessage() {
  if (!chatMessageDraft.value.trim() || !activeChatUser.value) return;
  const text = chatMessageDraft.value;
  chatMessageDraft.value = '';
  dispatchChatMessage(text, 'none').catch((err) => {
    console.error('Sealed chat send error:', err);
  });
}

function uploadEncryptedBlobViaHttps(encryptedBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.location.protocol !== 'https:' && !isLocalDev) {
      reject(new Error('HTTPS/TLS required for encrypted media upload'));
      return;
    }

    isUploadingChatMedia.value = true;
    chatUploadProgress.value = 0;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl('/api/upload/encrypted'));
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        chatUploadProgress.value = Math.round((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      isUploadingChatMedia.value = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          const uploadedUrl = res?.encryptedUrl;
          if (res?.protocol === 'HTTPS' && res?.zeroKnowledge && isValidHttpsChatMediaUrl(uploadedUrl)) {
            resolve(uploadedUrl);
          } else {
            reject(new Error('Invalid HTTPS encrypted upload response'));
          }
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`HTTPS encrypted upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      isUploadingChatMedia.value = false;
      reject(new Error('Network error during HTTPS encrypted upload'));
    };

    xhr.send(encryptedBlob);
  });
}

async function handleChatVideoUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files || !target.files[0] || !activeChatUser.value) return;
  const file = target.files[0];
  const targetRecipientId = activeChatUser.value.clientId;
  target.value = '';
  chatUploadingMediaType.value = 'video';
  chatSecurityError.value = '';

  const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const localPreviewUrl = URL.createObjectURL(file);
  decryptedMediaUrls.add(localPreviewUrl);
  const now = new Date();
  chatMessages.value.push({
    id: msgId,
    conversationId: [clientId.value, targetRecipientId].sort().join('--'),
    senderClientId: clientId.value,
    recipientClientId: targetRecipientId,
    sender: {
      name: userName.value,
      handle: userHandle.value,
      avatar: userAvatar.value || '',
    },
    text: '',
    mediaType: 'video',
    mediaUrl: localPreviewUrl,
    isE2EE: true,
    lockdownEnforced: lockdownMode.value,
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
  });
  scrollChatToBottom();

  try {
    const encrypted = await magmaE2EE.encryptMediaFile(file, lockdownMode.value);
    const encryptedUrl = await uploadEncryptedBlobViaHttps(encrypted.encryptedBlob);
    await dispatchChatMessage(
      '',
      'video',
      {
        mediaUrl: encryptedUrl,
        mediaKeyB64: encrypted.mediaKeyB64,
        mediaIvB64: encrypted.mediaIvB64,
        mediaChaChaKeyB64: encrypted.mediaChaChaKeyB64,
        mediaChaChaNonceB64: encrypted.mediaChaChaNonceB64,
        mediaCipherMode: encrypted.mediaCipherMode,
        mediaMimeType: encrypted.mediaMimeType,
        mediaSha3Digest: encrypted.mediaSha3Digest,
      },
      targetRecipientId,
      msgId
    );
  } catch (err) {
    console.error('E2EE HTTPS video upload error:', err);
    chatMessages.value = chatMessages.value.filter((m) => m.id !== msgId);
    URL.revokeObjectURL(localPreviewUrl);
    decryptedMediaUrls.delete(localPreviewUrl);
  }
}

async function handleChatImageUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files || !target.files[0] || !activeChatUser.value) return;
  const file = target.files[0];
  const targetRecipientId = activeChatUser.value.clientId;
  target.value = '';
  chatUploadingMediaType.value = 'image';
  chatSecurityError.value = '';

  const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const localPreviewUrl = URL.createObjectURL(file);
  decryptedMediaUrls.add(localPreviewUrl);
  const now = new Date();
  chatMessages.value.push({
    id: msgId,
    conversationId: [clientId.value, targetRecipientId].sort().join('--'),
    senderClientId: clientId.value,
    recipientClientId: targetRecipientId,
    sender: {
      name: userName.value,
      handle: userHandle.value,
      avatar: userAvatar.value || '',
    },
    text: '',
    mediaType: 'image',
    mediaUrl: localPreviewUrl,
    isE2EE: true,
    lockdownEnforced: lockdownMode.value,
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
  });
  scrollChatToBottom();

  try {
    const encrypted = await magmaE2EE.encryptMediaFile(file, lockdownMode.value);
    const encryptedUrl = await uploadEncryptedBlobViaHttps(encrypted.encryptedBlob);
    await dispatchChatMessage(
      '',
      'image',
      {
        mediaUrl: encryptedUrl,
        mediaKeyB64: encrypted.mediaKeyB64,
        mediaIvB64: encrypted.mediaIvB64,
        mediaChaChaKeyB64: encrypted.mediaChaChaKeyB64,
        mediaChaChaNonceB64: encrypted.mediaChaChaNonceB64,
        mediaCipherMode: encrypted.mediaCipherMode,
        mediaMimeType: encrypted.mediaMimeType,
        mediaSha3Digest: encrypted.mediaSha3Digest,
      },
      targetRecipientId,
      msgId
    );
  } catch (err) {
    console.error('E2EE HTTPS image upload error:', err);
    chatMessages.value = chatMessages.value.filter((m) => m.id !== msgId);
    URL.revokeObjectURL(localPreviewUrl);
    decryptedMediaUrls.delete(localPreviewUrl);
  }
}

async function handleIncomingSealedEnvelope(record: { id: string; recipientClientId: string; sealedEnvelope: SealedEnvelope }) {
  if (!record?.sealedEnvelope || chatMessages.value.some((m) => m.id === record.id)) return;
  try {
    const myBundle = await ensureE2EEInitialized();
    const inner = await magmaE2EE.unsealAndDecryptMessage(
      record.sealedEnvelope,
      myBundle,
      resolvePeerBundle,
      lockdownMode.value
    );

    if (chatMessages.value.some((m) => m.id === inner.id)) return;

    const needsMediaDecrypt = (inner.mediaType === 'image' || inner.mediaType === 'video') && Boolean(inner.mediaUrl);
    if (needsMediaDecrypt && !isValidHttpsChatMediaUrl(inner.mediaUrl)) return;

    const decryptedMsg: ChatMessage = {
      id: inner.id,
      conversationId: [inner.senderClientId, inner.recipientClientId].sort().join('--'),
      senderClientId: inner.senderClientId,
      recipientClientId: inner.recipientClientId,
      sender: inner.sender,
      text: inner.text,
      mediaType: inner.mediaType,
      mediaUrl: '',
      mediaDecrypting: needsMediaDecrypt,
      isE2EE: true,
      ratchetCounter: inner.ratchetCounter,
      lockdownEnforced: inner.lockdownEnforced,
      createdAt: inner.createdAt,
      timestamp: inner.timestamp,
    };

    chatMessages.value.push(decryptedMsg);

    const isViewingThisSender =
      showMessengerModal.value && activeChatUser.value?.clientId === inner.senderClientId;

    if (isViewingThisSender) {
      scrollChatToBottom();
    } else if (inner.senderClientId !== clientId.value) {
      unreadCounts[inner.senderClientId] = (unreadCounts[inner.senderClientId] || 0) + 1;
      const previewText = lockdownMode.value
        ? t.value.lockdownHiddenPreview
        : inner.mediaType === 'video'
        ? t.value.sentVideoNotice
        : inner.mediaType === 'image'
        ? t.value.sentPhotoNotice
        : inner.text;
      triggerIphoneNotification({
        senderClientId: inner.senderClientId,
        senderName: inner.sender?.name || 'مستخدم MAGMA',
        senderHandle: inner.sender?.handle || 'user',
        avatar: inner.sender?.avatar || '',
        body: previewText,
      });
    }

    if (needsMediaDecrypt && inner.mediaUrl) {
      try {
        const res = await fetch(mediaSrc(inner.mediaUrl));
        if (!res.ok) throw new Error(`HTTPS fetch failed: ${res.status}`);
        const encBuffer = await res.arrayBuffer();
        const plainBlob = await magmaE2EE.decryptMediaBytes(encBuffer, inner);
        const objectUrl = URL.createObjectURL(plainBlob);
        decryptedMediaUrls.add(objectUrl);

        const idx = chatMessages.value.findIndex((m) => m.id === inner.id);
        if (idx !== -1) {
          chatMessages.value[idx] = {
            ...chatMessages.value[idx],
            mediaUrl: objectUrl,
            mediaDecrypting: false,
          };
          if (isViewingThisSender) scrollChatToBottom();
        }
      } catch (mediaErr) {
        console.error('E2EE Media decryption failed:', mediaErr);
        const idx = chatMessages.value.findIndex((m) => m.id === inner.id);
        if (idx !== -1) {
          chatMessages.value[idx] = {
            ...chatMessages.value[idx],
            mediaDecrypting: false,
            text: chatMessages.value[idx].text || '⚠️ تعذر فك تشفير الوسائط',
          };
        }
      }
    }

    magmaE2EE.sealLocalMessages(clientId.value, chatMessages.value);

    // Acknowledge receipt so server purges relayed sealed envelope (and shreds .bin media in Lockdown Mode)
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          action: 'ack_sealed_chat',
          id: inner.id,
          recipientClientId: clientId.value,
          burnMedia: lockdownMode.value && Boolean(inner.mediaUrl),
          mediaUrl: inner.mediaUrl || '',
        })
      );
    }
  } catch (err) {
    console.error('Sealed Envelope E2EE unseal error:', err);
  }
}

function handleSocketEvent(data: any) {
  switch (data.type) {
    case 'init':
      if (Array.isArray(data.posts)) {
        posts.value = data.posts;
      }
      if (Array.isArray(data.stories)) {
        stories.value = data.stories;
      }
      if (Array.isArray(data.shortVideos)) {
        shortVideos.value = data.shortVideos;
      }
      if (typeof data.onlineCount === 'number') {
        onlineCount.value = data.onlineCount;
      }
      break;

    case 'short_video_created':
      if (data.shortVideo) {
        const index = shortVideos.value.findIndex((s) => s.id === data.shortVideo.id);
        if (index === -1) {
          shortVideos.value.unshift(data.shortVideo);
        } else {
          shortVideos.value[index] = data.shortVideo;
        }
      }
      break;

    case 'short_video_updated':
      if (data.shortVideo) {
        const index = shortVideos.value.findIndex((s) => s.id === data.shortVideo.id);
        if (index !== -1) {
          shortVideos.value[index] = data.shortVideo;
        }
      }
      break;

    case 'short_video_deleted':
      if (data.shortVideoId) {
        if (activeShortVideoIndex.value !== null && shortVideos.value[activeShortVideoIndex.value]?.id === data.shortVideoId) {
          closeShortVideoViewer();
        }
        shortVideos.value = shortVideos.value.filter((s) => s.id !== data.shortVideoId);
      }
      break;

    case 'short_video_rejected':
      hasInappropriateShortVideo.value = true;
      isPublishingShortVideo.value = false;
      break;

    case 'presence':
      if (typeof data.onlineCount === 'number') {
        onlineCount.value = data.onlineCount;
      }
      break;

    case 'story_created':
      if (data.story) {
        const index = stories.value.findIndex((s) => s.id === data.story.id);
        if (index !== -1) {
          const existing = stories.value[index];
          // Preserve local blob URL during current session so active 4K playback never stalls/restarts
          const preservedUrl = existing.mediaUrl?.startsWith('blob:') ? existing.mediaUrl : data.story.mediaUrl;
          stories.value[index] = { ...data.story, mediaUrl: preservedUrl };
        } else {
          stories.value.unshift(data.story);
        }
      }
      break;

    case 'story_deleted':
      if (data.storyId) {
        if (activeStoryIndex.value !== null && stories.value[activeStoryIndex.value]?.id === data.storyId) {
          stopStoryVideo();
          closeStoryViewer();
        }
        stories.value = stories.value.filter((s) => s.id !== data.storyId);
      }
      break;

    case 'post_created':
      if (data.post) {
        const exists = posts.value.some((p) => p.id === data.post.id);
        if (!exists) {
          posts.value.unshift(data.post);
          newPostAlert.value = true;
          setTimeout(() => {
            newPostAlert.value = false;
          }, 4000);
        }
      }
      break;

    case 'post_updated':
      if (data.post) {
        const index = posts.value.findIndex((p) => p.id === data.post.id);
        if (index !== -1) {
          posts.value[index] = data.post;
        }
      }
      break;

    case 'post_deleted':
      if (data.postId) {
        posts.value = posts.value.filter((p) => p.id !== data.postId);
        deleteAlertMessage.value = 'تم حذف الفيديو';
        deleteAlert.value = true;
        setTimeout(() => {
          deleteAlert.value = false;
        }, 3500);
      }
      break;

    case 'users_list':
      if (Array.isArray(data.users)) {
        chatUsers.value = data.users;
        data.users.forEach((u: ChatUser) => {
          if (u.e2eeBundle) {
            peerBundlesCache[u.clientId] = u.e2eeBundle;
          }
          if (!u.avatar) {
            applySilentAvatarSync(u.clientId, '');
          }
        });
        if (activeChatUser.value) {
          const updated = data.users.find((u: ChatUser) => u.clientId === activeChatUser.value?.clientId);
          if (updated) activeChatUser.value = updated;
        }
      }
      break;

    case 'profile_avatar_synced':
      if (data.clientId) {
        applySilentAvatarSync(data.clientId, data.avatar || '');
      }
      break;

    case 'chat_init':
      if (Array.isArray(data.sealedEnvelopes)) {
        data.sealedEnvelopes.forEach((env: any) => {
          handleIncomingSealedEnvelope(env);
        });
      }
      if (Array.isArray(data.friends)) {
        friendIds.value = data.friends;
      }
      break;

    case 'friends_updated':
      if (Array.isArray(data.friends)) {
        friendIds.value = data.friends;
      }
      if (data.addedBy && data.addedBy.clientId !== clientId.value) {
        triggerIphoneNotification({
          senderClientId: data.addedBy.clientId,
          senderName: data.addedBy.name || 'مستخدم MAGMA',
          senderHandle: data.addedBy.handle || 'user',
          avatar: data.addedBy.avatar || '',
          body: t.value.addedFriendNotice,
        });
      }
      break;

    case 'sealed_chat_received':
      if (data.envelope) {
        handleIncomingSealedEnvelope(data.envelope);
      }
      break;

    case 'chat_media_rejected':
      if (data.id) {
        chatMessages.value = chatMessages.value.filter((m) => m.id !== data.id);
      }
      if (data.error) {
        chatSecurityError.value = data.error;
      }
      break;
  }
}

function sendSocketAction(action: string, payload: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ action, ...payload }));
  } else {
    connectWebSocket();
  }
}

// Submit a new post (Uploads video strictly via HTTPS, then broadcasts lightweight metadata)
async function submitPost() {
  if (hasProfanity.value || hasInappropriateVideo.value) return;
  if (!postContent.value.trim() && !mediaUrl.value && !selectedVideoFile.value && !selectedImageFile.value) return;

  isPublishing.value = true;
  let finalMediaUrl = mediaUrl.value;

  try {
    // 1. If video was selected from device, upload it ONLY via HTTPS stream (Zero WebSocket bloat)
    if (selectedMediaType.value === 'video' && selectedVideoFile.value) {
      finalMediaUrl = await uploadVideoViaHttps(selectedVideoFile.value);
    } else if (selectedMediaType.value === 'image' && selectedImageFile.value) {
      finalMediaUrl = await uploadImageViaHttps(selectedImageFile.value);
    }
  } catch (err: any) {
    console.error('HTTPS Media Upload error:', err);
    deleteAlertMessage.value = 'تعذر رفع الفيديو عبر HTTPS، يرجى المحاولة مرة أخرى.';
    deleteAlert.value = true;
    setTimeout(() => {
      deleteAlert.value = false;
    }, 4000);
    isPublishing.value = false;
    return;
  }

  const payload = {
    clientId: clientId.value,
    author: {
      name: userName.value,
      handle: userHandle.value,
      avatar: userAvatar.value || '',
      verified: true,
    },
    content: postContent.value.trim(),
    mediaType: selectedMediaType.value,
    mediaUrl: finalMediaUrl || undefined,
  };

  // 2. Post creation sent via HTTPS REST API (guarantees persistence across all OS/browsers)
  // and real-time WebSocket broadcast (lightweight HTTPS URL string only, zero socket bloat)
  try {
    const res = await fetch(apiUrl('/api/posts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      sendSocketAction('create_post', payload);
    }
  } catch (err) {
    sendSocketAction('create_post', payload);
  }

  postContent.value = '';
  clearMedia();
  isPublishing.value = false;

  deleteAlertMessage.value = 'تم النشر بنجاح';
  deleteAlert.value = true;
  setTimeout(() => {
    deleteAlert.value = false;
  }, 3500);
}


// Like / React (Private & Local only for privacy - no notifications or public counter broadcast)
function toggleLike(postId: string) {
  const post = posts.value.find((p) => p.id === postId);
  if (post) {
    if (!post.likedBy) post.likedBy = [];
    const index = post.likedBy.indexOf(clientId.value);
    if (index === -1) {
      post.likedBy.push(clientId.value);
      post.likes += 1;
    } else {
      post.likedBy.splice(index, 1);
      post.likes = Math.max(0, post.likes - 1);
    }
  }
}

// Toggle comment section
function toggleCommentBox(postId: string) {
  if (activeCommentPostId.value === postId) {
    activeCommentPostId.value = null;
  } else {
    activeCommentPostId.value = postId;
    commentDraft.value = '';
  }
}

// Submit comment
function submitComment(postId: string) {
  if (!commentDraft.value.trim()) return;

  sendSocketAction('add_comment', {
    postId,
    clientId: clientId.value,
    author: {
      name: userName.value,
      avatar: userAvatar.value || '',
    },
    text: commentDraft.value.trim(),
  });

  commentDraft.value = '';
}

function startEditComment(comment: Comment) {
  editingCommentId.value = comment.id;
  editTextDraft.value = comment.text;
}

function cancelEditComment() {
  editingCommentId.value = null;
  editTextDraft.value = '';
}

function saveEditComment(postId: string, commentId: string) {
  if (!editTextDraft.value.trim()) return;
  sendSocketAction('update_comment', {
    postId,
    commentId,
    text: editTextDraft.value.trim(),
  });
  editingCommentId.value = null;
  editTextDraft.value = '';
}

function deleteComment(postId: string, commentId: string) {
  sendSocketAction('delete_comment', {
    postId,
    commentId,
  });
  deleteAlertMessage.value = 'تم حذف التعليق بنجاح';
  deleteAlert.value = true;
  setTimeout(() => {
    deleteAlert.value = false;
  }, 3000);
}

// Request delete confirmation modal (بديل احترافي لـ window.confirm الذي يتم حظره في الآي فريم)
function requestDeletePost(post: Post) {
  postToDelete.value = post;
}

// Confirm and execute instant delete across WebSocket and REST API
async function confirmDeletePost() {
  if (!postToDelete.value) return;
  const postId = postToDelete.value.id;
  postToDelete.value = null;

  // 1. حذف فوري استباقي في الواجهة الحالية
  posts.value = posts.value.filter((p) => p.id !== postId);

  // 2. بث أمر الحذف عبر خادم WebSocket لجميع المتصفحات المتصلة فوراً
  sendSocketAction('delete_post', { postId });

  // 3. مسار تأكيد خلفي عبر REST API لضمان الحذف الدائم على الخادم
  try {
    await fetch(apiUrl(`/api/posts/${postId}`), { method: 'DELETE' });
  } catch (err) {
    console.warn('REST delete fallback error:', err);
  }

  // 4. إشعار تأكيد بنجاح الحذف والمزامنة
  deleteAlertMessage.value = 'تم حذف الفيديو';
  deleteAlert.value = true;
  setTimeout(() => {
    deleteAlert.value = false;
  }, 3500);
}

function fallbackCopy(text: string) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    copiedAlert.value = true;
    setTimeout(() => {
      copiedAlert.value = false;
    }, 3000);
  } catch (err) {
    console.warn('Copy fallback failed:', err);
  }
}

function copyPostLink(postId: string) {
  const url = `${window.location.origin}#post-${postId}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      copiedAlert.value = true;
      setTimeout(() => {
        copiedAlert.value = false;
      }, 3000);
    }).catch(() => fallbackCopy(url));
  } else {
    fallbackCopy(url);
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    showProfileModal.value = false;
    showMessengerModal.value = false;
    modalImageUrl.value = null;
    postToDelete.value = null;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (postContent.value.trim() || mediaUrl.value) {
      submitPost();
    }
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  newPostAlert.value = false;
}

// Computed Filtered Posts & Counts
const filteredPosts = computed(() => {
  if (feedFilter.value === 'video') {
    return posts.value.filter((p) => p.mediaType === 'video');
  }
  if (feedFilter.value === 'image') {
    return posts.value.filter((p) => p.mediaType === 'image');
  }
  return posts.value;
});

const videoPostsCount = computed(() => posts.value.filter((p) => p.mediaType === 'video').length);
const imagePostsCount = computed(() => posts.value.filter((p) => p.mediaType === 'image').length);

async function fetchPosts() {
  try {
    const res = await fetch(apiUrl('/api/posts'));
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (Array.isArray(data.posts) && posts.value.length === 0) {
        posts.value = data.posts;
      }
      if (typeof data.onlineCount === 'number') {
        onlineCount.value = Math.max(1, data.onlineCount);
      }
    }
  } catch (e) {
    // silently continue
  }
}

onMounted(() => {
  autoDetectDeviceLanguage();
  ensureE2EEInitialized().then(() => {
    registerUserOnSocket();
  });
  connectWebSocket();
  fetchPosts();
  fetchShortVideos();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  clearTimeout(reconnectTimer);
  decryptedMediaUrls.forEach((u) => URL.revokeObjectURL(u));
  decryptedMediaUrls.clear();
  if (socket) {
    socket.close();
  }
  window.removeEventListener('keydown', handleKeydown);
});

</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}
</style>

import { elements } from './elements.js';
import { ICONS, AVATAR_COLORS } from '../config/constants.js';
import { PipDragger } from "./PipDragger.js";

export class UIManager {
    constructor() {
        this.state = {
            userID: "",
            pendingOffer: null,
            contacts: [
                { id: 1, name: 'Alex Johnson', detail: '+1 (555) 234-5678', online: true },
                { id: 2, name: 'Sarah Chen', detail: 'sarah.chen@email.com', online: true },
                { id: 3, name: 'Mike Williams', detail: '+1 (555) 876-5432', online: false },
                { id: 4, name: 'Emma Davis', detail: 'emma.d@email.com', online: true },
                { id: 5, name: 'James Wilson', detail: '+1 (555) 111-2233', online: false },
                { id: 6, name: 'Olivia Martinez', detail: 'olivia.m@email.com', online: true },
                { id: 7, name: 'Liam Brown', detail: '+1 (555) 444-7788', online: false },
                { id: 8, name: 'Sophia Lee', detail: 'sophia.lee@email.com', online: true },
            ],
            nextId: 9,
            screen: 'idle',       // idle | calling | incall
            activeContact: null,
            isMuted: false,
            isCamOff: false,
            isMirrored: true,
            callSeconds: 0,
            callTimer: null,
            localStream: null,
            facingMode: 'user',
            incomingContact: null,
        };

    }

    setConnectionId(connectionID) {
        this.state.connectionID = connectionID;
    }

    getUserId() {
        return this.state.userID;
    }

    showIncomingCall(callerID, offer) {
        this.state.pendingOffer = { callerID, offer };
        elements.incomingCallText.textContent = `Receiving call from: ${callerID}`;
        elements.incomingCallDiv.classList.remove('hidden');
    }

    hideIncomingCall() {
        elements.incomingCallDiv.classList.add('hidden');
    }

    deletePendingOffer() {
        this.state.pendingOffer = null;
        return;
    }

    getPendingOffer() {
        return this.state.pendingOffer;
    }

    getCallInputValue() {
        return elements.callInput.value;
    }


    // DYNAMIC UI METHODS
    renderContacts(filter = '') {
      const q = filter.toLowerCase();
      const filtered = this.state.contacts.filter(c => c.name.toLowerCase().includes(q) || c.detail.toLowerCase().includes(q));

      if (filtered.length === 0) {
        elements.contactsList.innerHTML = '<div class="no-contacts"><p>' + (filter ? 'No contacts found' : 'No contacts yet. Add someone to get started!') + '</p></div>';
        return;
      }

      elements.contactsList.innerHTML = filtered.map(c => {
        const color = this.getColor(c.name);
        const initials = this.getInitials(c.name);
        return '<div class="contact-item" data-id="' + c.id + '">' +
          '<div class="contact-avatar" style="background:' + color + '">' + initials + '</div>' +
          '<div class="contact-details">' +
            '<div class="contact-name">' + c.name + '</div>' +
            '<div class="contact-sub">' + c.detail + '</div>' +
          '</div>' +
          '<button class="contact-call" data-call="' + c.id + '" aria-label="Call ' + c.name + '">' + ICONS.video + '</button>' +
        '</div>';
      }).join('');

      // Attach click handlers
      elements.contactsList.querySelectorAll('.contact-call').forEach(btn => {
        btn.addEventListener('click', (e) => {
          console.log("We have clicked this contact:", e)
          e.stopPropagation();
          const id = parseInt(btn.dataset.call);
          const contact = this.state.contacts.find(c => c.id === id);
          if (contact) this.startCall(contact);
        });
      });

      elements.contactsList.querySelectorAll('.contact-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = parseInt(item.dataset.id);
          const contact = this.state.contacts.find(c => c.id === id);
          if (contact) this.startCall(contact);
        });
      });
    }

    // HELPERS
    //TODO: All instances of this should be using this.getInitials
    getInitials(name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
      return name.slice(0,2).toUpperCase();
    }

    //TODO: All instances of this should be using this.getColor
    getColor(name) {
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
    }

    //TODO: All instances of this should be using this.formatTIme
    formatTime(s) {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
    }

    /// TODO: All instances shuold use this.isMobile
    isMobile() { return window.innerWidth <= 768; }

    // ---- Screen Management ----
    showScreen(name) {
      this.state.screen = name;
      elements.idleScreen.classList.toggle('hidden', name !== 'idle');
      elements.callingScr.classList.toggle('hidden', name !== 'calling');
      elements.callScreen.classList.toggle('hidden', name !== 'incall');
    }



    // ---- Call Flow ----
    startCall(contact) {
      this.state.activeContact = contact;
      this.showScreen('calling');

      // Close sidebar on mobile
      if (this.isMobile()) this.closeSidebar();

      // Set calling screen info
      elements.callingAvatar.textContent = this.getInitials(contact.name);
      elements.callingAvatar.style.background = this.getColor(contact.name);
      elements.callingName.textContent = contact.name;

      // Simulate ringing for 3 seconds then connect
      setTimeout(() => {
        if (this.state.screen === 'calling' && this.state.activeContact === contact) {
          this.connectCall(contact);
        }
      }, 1000);
    }

    async connectCall(contact) {
      this.showScreen('incall');

      // Remote area (simulated)
      const color = this.getColor(contact.name);
      elements.remoteArea.innerHTML =
        '<div class="remote-fallback">' +
          '<div class="big-avatar" style="background:' + color + '">' + this.getInitials(contact.name) + '</div>' +
          '<div class="remote-label">' + contact.name + '</div>' +
        '</div>';

      elements.infoName.textContent = contact.name;
      this.state.callSeconds = 0;
      elements.infoTimer.textContent = '00:00';

      // Start timer
      this.state.callTimer = setInterval(() => {
        this.state.callSeconds++;
        elements.infoTimer.textContent = this.formatTime(this.state.callSeconds);
      }, 1000);

      // Reset control states
      this.state.isMuted = false;
      this.state.isCamOff = false;
      this.updateControlIcons();

      // Start local camera
      await this.startLocalCamera();
      elements.localVideoPip.srcObject = this.state.localStream;
    }

    endCall() {
      console.log("Clearing Timer state")
      if (this.state.callTimer) { clearInterval(this.state.callTimer); this.state.callTimer = null; }
      // this.stopLocalCamera();
      console.log("Clearing active contact state")
      this.state.activeContact = null;
      console.log("Switching to idle screen")
      this.showScreen('idle');
    }

    cancelCall() {
      this.state.activeContact = null;
      this.showScreen('idle');
    }


    // ---- Camera / Media ----
    async startLocalCamera() {
      try {
        const constraints = {
          video: { facingMode: this.state.facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true
        };
        this.state.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        elements.localVideoFullscreen.srcObject = this.state.localStream;
        elements.localVideoFullscreen.classList.toggle('no-mirror', !this.state.isMirrored);
        elements.pipWrap.classList.remove('hidden');
        elements.pipNoCam.classList.add('hidden');
        elements.localVideoFullscreen.classList.remove('hidden');

        // Mute audio track if user had muted
        this.state.localStream.getAudioTracks().forEach(t => t.enabled = !this.state.isMuted);

        // Populate device settings
        this.enumerateDevices();
      } catch (err) {
        // Camera access denied or unavailable
        elements.localVideoFullscreen.classList.add('hidden');
        elements.pipNoCam.classList.remove('hidden');
        console.error("Error loading in camera", err);
      }
    }

    stopLocalCamera() {
      if (this.state.localStream) {
        this.state.localStream.getTracks().forEach(t => t.stop());
        this.state.localStream = null;
      }
    }

    toggleMute() {
      this.state.isMuted = !this.state.isMuted;
      if (this.state.localStream) {
        this.state.localStream.getAudioTracks().forEach(t => t.enabled = !this.state.isMuted);
      }
      this.updateControlIcons();
    }

    toggleCamera() {
      this.state.isCamOff = !this.state.isCamOff;
      if (this.state.localStream) {
        this.state.localStream.getVideoTracks().forEach(t => t.enabled = !this.state.isCamOff);
      }
      if (this.state.isCamOff) {
        this.localVideo.classList.add('hidden');
        this.pipNoCam.classList.remove('hidden');
      } else {
        this.localVideo.classList.remove('hidden');
        this.pipNoCam.classList.add('hidden');
      }
      this.updateControlIcons();
    }

    async flipCamera() {
      this.state.facingMode = this.state.facingMode === 'user' ? 'environment' : 'user';
      if (this.state.localStream && this.state.screen === 'incall') {
        this.stopLocalCamera();
        await this.startLocalCamera();
      }
    }

    updateControlIcons() {
      const muteBtn = elements.controlMute;
      const camBtn = elements.controlCam;

      // Update mute button
      const muteLabel = muteBtn.querySelector('.ctrl-label');
      muteBtn.innerHTML = this.state.isMuted ? ICONS.micOff : ICONS.mic;
      muteBtn.classList.toggle('active', this.state.isMuted);
      const ml = document.createElement('span');
      ml.className = 'ctrl-label';
      ml.textContent = this.state.isMuted ? 'Unmute' : 'Mute';
      muteBtn.appendChild(ml);

      // Update camera button
      const camLabel = camBtn.querySelector('.ctrl-label');
      camBtn.innerHTML = this.state.isCamOff ? ICONS.videoOff : ICONS.video;
      camBtn.classList.toggle('active', this.state.isCamOff);
      const cl = document.createElement('span');
      cl.className = 'ctrl-label';
      cl.textContent = this.state.isCamOff ? 'Camera On' : 'Camera Off';
      camBtn.appendChild(cl);
    }


    // ---- Device Enumeration ----
    async enumerateDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const camSel = elements.selectCamera;
        const micSel = elements.selectMic;
        const spkSel = elements.selectSpeaker;

        camSel.innerHTML = '';
        micSel.innerHTML = '';
        spkSel.innerHTML = '';

        let camCount = 0, micCount = 0, spkCount = 0;

        devices.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.deviceId;

          if (d.kind === 'videoinput') {
            camCount++;
            opt.textContent = d.label || ('Camera ' + camCount);
            camSel.appendChild(opt);
          } else if (d.kind === 'audioinput') {
            micCount++;
            opt.textContent = d.label || ('Microphone ' + micCount);
            micSel.appendChild(opt);
          } else if (d.kind === 'audiooutput') {
            spkCount++;
            opt.textContent = d.label || ('Speaker ' + spkCount);
            spkSel.appendChild(opt);
          }
        });

        if (camSel.children.length === 0) camSel.innerHTML = '<option>No cameras found</option>';
        if (micSel.children.length === 0) micSel.innerHTML = '<option>No microphones found</option>';
        if (spkSel.children.length === 0) spkSel.innerHTML = '<option>Default Speaker</option>';
      } catch(e) {
        // Silently fail
        console.error(e)
      }
    }


    // ---- Camera change from settings ----
    async changeCamera(deviceId) {
      if (!this.state.localStream || this.state.screen !== 'incall') return;
      this.stopLocalCamera();
      try {
        this.state.localStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: true
        });
        this.localVideo.srcObject = this.state.localStream;
        this.state.localStream.getAudioTracks().forEach(t => t.enabled = !this.state.isMuted);
        if (this.state.isCamOff) {
          this.state.localStream.getVideoTracks().forEach(t => t.enabled = false);
        }
      } catch(e) {
        console.error(e)
        await this.startLocalCamera();
      }
    }


    // ---- Incoming Call ----
    //TODO: Use this when a call is actually incoming
    // simulateIncoming() {
    //   // Pick a random contact that isn't the active one
    //   const pool = this.state.contacts.filter(c => c !== this.state.activeContact);
    //   if (pool.length === 0) return;
    //   const contact = pool[Math.floor(Math.random() * pool.length)];
    //   this.state.incomingContact = contact;
    //
    //   this.incAvatar.textContent = this.getInitials(contact.name);
    //   this.incAvatar.style.background = this.getColor(contact.name);
    //   this.incName.textContent = contact.name;
    //
    //   this.incomingEl.classList.add('show');
    // }
    //
    acceptIncoming() {
      elements.incomingEl.classList.remove('show');
      const contact = this.state.incomingContact;
      this.state.incomingContact = null;

      // End current call if any
      if (this.state.screen === 'incall') this.endCall();
      if (this.state.screen === 'calling') this.cancelCall();

      // Start new call
      if (contact) {
        this.state.activeContact = contact;
        this.connectCall(contact);
      }
    }

    declineIncoming() {
      console.log("Decline Incoming call was called");
      this.state.incomingContact = null;
      this.showScreen('idle');
    }


    // ---- Sidebar Toggle (mobile) ----
    openSidebar() {
      elements.sidebar.classList.add('open');
      elements.sidebarOvl.classList.add('active');
    }

    closeSidebar() {
      elements.sidebar.classList.remove('open');
      elements.sidebarOvl.classList.remove('active');
    }


    /*
     *
    searchInput: document.getElementById('search-input'),
    idleScreen: document.getElementById('idle-screen'),
    callingScr: document.getElementById('calling-screen'),
    callScreen: document.getElementById('call-screen'),
    callingAvatar: document.getElementById('calling-avatar'),
    callingName: document.getElementById('calling-name'),
    remoteArea: document.getElementById('remote-area'),
    localVideo: document.getElementById('local-video'),
    pipWrap: document.getElementById('pip-wrap'),
    pipNoCam: document.getElementById('pip-no-cam'),
    infoName: document.getElementById('info-name'),
    infoTimer: document.getElementById('info-timer'),
    incomingEl: document.getElementById('incoming-call'),
    incAvatar: document.getElementById('inc-avatar'),
    incName: document.getElementById('inc-name'),
    settingsPanel: document.getElementById('settings-panel'),
    addModal: document.getElementById('add-modal'),
    */


    // ---- Settings ----
    openSettings() {
      this.enumerateDevices();
      elements.settingsPanel.classList.add('show');
    }

    closeSettings() {
      elements.settingsPanel.classList.remove('show');
    }

    // ---- Add Contact ----
    openAddModal() {
      elements.nameInput.value = '';
      elements.detailInput.value = '';
      elements.addModal.classList.add('show');
      setTimeout(() => elements.nameInput.focus(), 100);
    }

    closeAddModal() {
      elements.addModal.classList.remove('show');
    }

    addContact() {
      const name = elements.nameInput.value.trim();
      const detail = elements.detailInput.value.trim();
      if (!name) return;
      this.state.contacts.push({
        id: this.state.nextId++,
        name: name,
        detail: detail || 'No details',
        online: Math.random() > 0.5
      });
      this.closeAddModal();
      this.renderContacts();
    }


    // SETUP METHODS
    setupButtons() {
        // Inject icons into buttons that need them
        document.getElementById('menu-btn').innerHTML = ICONS.menu;
        document.getElementById('mobile-settings-btn').innerHTML = ICONS.settings;
        document.getElementById('cancel-call-btn').innerHTML = ICONS.phone;
        document.getElementById('ctrl-mute').insertAdjacentHTML('afterbegin', ICONS.mic),
        document.getElementById('ctrl-cam').insertAdjacentHTML('afterbegin', ICONS.video),
        document.getElementById('ctrl-flip').insertAdjacentHTML('afterbegin', ICONS.flip),
        document.getElementById('ctrl-end').innerHTML = ICONS.phone;
        document.getElementById('ctrl-settings').insertAdjacentHTML('afterbegin', ICONS.settings),
        document.getElementById('inc-decline').innerHTML = ICONS.phone;
        document.getElementById('inc-accept').innerHTML = ICONS.video;
        document.getElementById('close-settings').innerHTML = ICONS.close;
    }

    async setupEventListeners(onCall, onAccept, onDecline) {

        // elements.callButton.addEventListener("click", (e) => {
        //     e.preventDefault();
        //     onCall();
        // });
        //
        // elements.incomingCallAcceptButton.addEventListener("click", (e) => {
        //     e.preventDefault();
        //     onAccept();
        // });
        //
        // elements.incomingCallDeclineButton.addEventListener("click", (e) => {
        //     e.preventDefault();
        //     onDecline();
        // });

    // Mobile menu
    elements.menu.addEventListener('click',() => this.openSidebar());
    elements.sidebarOvl.addEventListener('click', () => this.closeSidebar());

    // Search
    elements.searchInput.addEventListener('input', () => this.renderContacts(elements.searchInput.value));

    // Add contact
    elements.addButton.addEventListener('click', () => this.openAddModal());
    elements.cancelModal.addEventListener('click', () => this.closeAddModal());
    elements.confirmModal.addEventListener('click', () => this.addContact());
    elements.nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#inp-detail').focus(); });
    elements.detailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.addContact(); });
    elements.addModal.addEventListener('click', (e) => { if (e.target === elements.addModal) this.closeAddModal(); });

   //  // Settings
    elements.settingsButton.addEventListener('click', () => this.openSettings());
    elements.mobileSettingsButton.addEventListener('click', () => this.openSettings());
    elements.closeSettings.addEventListener('click', () => this.closeSettings());
    elements.controlSettings.addEventListener('click', () => this.openSettings());
    elements.settingsPanel.addEventListener('click', (e) => { if (e.target === elements.settingsPanel) this.closeSettings(); });

    //NOTE: Check if this needs to be modified with local video pip or some shit
    // Mirror toggle
    elements.toggleMirror.addEventListener('click', function() {
      this.state.isMirrored = !this.state.isMirrored;
      this.classList.toggle('on', this.state.isMirrored);
      elements.localVideo.classList.toggle('no-mirror', !this.state.isMirrored);
    });
        
    // Camera select change
    elements.selectCamera.addEventListener('change', async () => await this.changeCamera(this.value));

    // Audio output change
    elements.selectSpeaker.addEventListener('change', function() {
      if (elements.localVideo.setSinkId) {
        elements.localVideo.setSinkId(this.value).catch(() => {});
      }
    });

    // Call controls
    elements.controlMute.addEventListener('click', () => this.toggleMute());
    elements.controlCam.addEventListener('click', () => this.toggleCamera());
    elements.controlFlip.addEventListener('click', () => this.flipCamera());
    elements.controlEnd.addEventListener('click', () => this.endCall());
    elements.cancelCallButton.addEventListener('click', () => this.cancelCall());

    // Incoming call
    elements.incomingAccept.addEventListener('click', () => this.acceptIncoming());
    elements.incomingDecline.addEventListener('click', () => this.declineIncoming());

   // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'Escape') {
        if (elements.addModal.classList.contains('show')) this.closeAddModal();
        else if (elements.settingsPanel.classList.contains('show')) this.closeSettings();
        else if (elements.incomingEl.classList.contains('show')) this.declineIncoming();
        else if (this.state.screen === 'calling') this.cancelCall();
      }
      if (e.key === 'm' && this.state.screen === 'incall') this.toggleMute();
      if (e.key === 'v' && this.state.screen === 'incall') this.toggleCamera();
    });

    }

    init() {
      try {
          this.pipDragger = new PipDragger(elements.pipWrap, elements.callScreen, this.isMobile, this.connectCall);
          this.pipDragger.setupPipDrag();
          this.renderContacts();
          this.updateControlIcons();
        }
      catch (err) {
            console.error("ERROR:", err)
        }
    }
}

// TODO: Just created this class, need to test it somehow. Also haven't quite finished adding everything to where it needs to go, figure that out
// Next time
class PipDragger {
    constructor(pipWrap, callScreen, isMobile) {
        this.pipWrap = pipWrap;
        this.callScreen = callScreen;
        this.isMobile = isMobile;

        this.isDragging = false;
        this.startX;
        this.startY;
        this.origX;
        this.origY;

        this.onStart = this.onStart.bind(this);
        this.onMove = this.onMove.bind(this);
        this.onEnd = this.onEnd.bind(this);

        this.setupPipDrag();
    }

    onStart(e) {
        this.isDragging = true;
        this.pipWrap.classList.add('dragging');
        const touch = e.touches ? e.touches[0] : e;
        const rect = pipWrap.getBoundingClientRect();
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.origX = rect.left;
        this.origY = rect.top;
        e.preventDefault();
    }


    onMove(e) {
        if (!this.isDragging) return;
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        let newX = origX + dx;
        let newY = origY + dy;

        // Get bounds from call-screen (the parent)
        const parent = this.callScreen.getBoundingClientRect();
        const pw = this.pipWrap.offsetWidth;
        const ph = this.pipWrap.offsetHeight;
        newX = Math.max(parent.left + 8, Math.min(newX, parent.right - pw - 8));
        newY = Math.max(parent.top + 8, Math.min(newY, parent.bottom - ph - 8));

        this.pipWrap.style.position = 'fixed';
        this.pipWrap.style.left = newX + 'px';
        this.pipWrap.style.top = newY + 'px';
        this.pipWrap.style.right = 'auto';
    }


    onEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.pipWrap.classList.remove('dragging');

        // Snap to nearest corner
        const parent = callScreen.getBoundingClientRect();
        const rect = pipWrap.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const midX = parent.left + parent.width / 2;
        const midY = parent.top + parent.height / 2;
        const pad = isMobile() ? 12 : 20;
        const topPad = isMobile() ? 72 : 20;

        let targetX, targetY;
        if (cx < midX) {
            targetX = parent.left + pad;
        } else {
            targetX = parent.right - rect.width - pad;
        }
        if (cy < midY) {
            targetY = parent.top + topPad;
        } else {
            targetY = parent.bottom - rect.height - (this.isMobile() ? 100 : 120);
        }

        this.pipWrap.style.transition = 'left 0.25s cubic-bezier(0.25,0.1,0.25,1), top 0.25s cubic-bezier(0.25,0.1,0.25,1)';
        this.pipWrap.style.left = targetX + 'px';
        this.pipWrap.style.top = targetY + 'px';
        setTimeout(() => { this.pipWrap.style.transition = ''; }, 300);
    }

    setupEventListeners() {
        this.pipWrap.addEventListener('mousedown', this.onStart);
        this.pipWrap.addEventListener('touchstart', this.onStart, { passive: false });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }


    setupPipDrag() {
        this.setupEventListeners;
    }
}

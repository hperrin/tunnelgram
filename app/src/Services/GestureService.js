// Passive feature detection.
let passiveIfSupported = false;

try {
  window.addEventListener('test', null, Object.defineProperty({}, 'passive', { get: function() { passiveIfSupported = { passive: true }; } }));
} catch(err) {}

// Adapted from https://gist.github.com/SleepWalker/da5636b1abcbaff48c4d
// and https://github.com/uxitten/xwiper

export class GestureService {
  constructor (element) {
    this.element = element;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    const pageWidth = window.innerWidth || document.body.clientWidth;
    this.threshold = Math.max(25, Math.floor(0.15 * pageWidth));
    this.velocityThreshold = 10;
    this.disregardVelocityThresholdX = Math.floor(0.5 * element.clientWidth);
    this.disregardVelocityThresholdY = Math.floor(0.5 * element.clientHeight);
    this.pressThreshold = 4;
    this.limit = Math.tan(45 * 1.5 / 180 * Math.PI);
    this.velocityX = null;
    this.velocityY = null;
    this.longPressTimer = null;
    this.onSwipeStartAgent = null;
    this.onSwipeMoveAgent = null;
    this.onSwipeEndAgent = null;
    this.onSwipeLeftAgent = null;
    this.onSwipeRightAgent = null;
    this.onSwipeUpAgent = null;
    this.onSwipeDownAgent = null;
    this.onTapAgent = null;
    this.onLongPressAgent = null;

    this._onTouchStart = this.onTouchStart.bind(this);
    this._onTouchMove = this.onTouchMove.bind(this);
    this._onTouchEnd = this.onTouchEnd.bind(this);

    this.element.addEventListener('touchstart', this._onTouchStart, passiveIfSupported);
    this.element.addEventListener('touchmove', this._onTouchMove, passiveIfSupported);
    this.element.addEventListener('touchend', this._onTouchEnd, passiveIfSupported);
  }

  onTouchStart (event) {
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
    this.touchMoveX = null;
    this.touchMoveY = null;
    this.touchEndX = null;
    this.touchEndY = null;
    this.longPressTimer = setTimeout(() => this.onLongPressAgent && this.onLongPressAgent(), 500);
    this.onSwipeStartAgent && this.onSwipeStartAgent();
  }

  onTouchMove (event) {
    const touchMoveX = event.changedTouches[0].screenX - this.touchStartX;
    this.velocityX = touchMoveX - this.touchMoveX;
    this.touchMoveX = touchMoveX;
    const touchMoveY = event.changedTouches[0].screenY - this.touchStartY;
    this.velocityY = touchMoveY - this.touchMoveY;
    this.touchMoveY = touchMoveY;
    if (Math.max(Math.abs(this.touchMoveX), Math.abs(this.touchMoveY)) > this.pressThreshold) {
      clearTimeout(this.longPressTimer);
    }
    this.onSwipeMoveAgent && this.onSwipeMoveAgent();
  }

  onTouchEnd (event) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.touchEndY = event.changedTouches[0].screenY;
    this.onSwipeEndAgent && this.onSwipeEndAgent();
    clearTimeout(this.longPressTimer);
    this.handleGesture();
  }

  onSwipeStart (func) {
    this.onSwipeStartAgent = func;
  }
  onSwipeMove (func) {
    this.onSwipeMoveAgent = func;
  }
  onSwipeEnd (func) {
    this.onSwipeEndAgent = func;
  }
  onSwipeLeft (func) {
    this.onSwipeLeftAgent = func;
  }
  onSwipeRight (func) {
    this.onSwipeRightAgent = func;
  }
  onSwipeUp (func) {
    this.onSwipeUpAgent = func;
  }
  onSwipeDown (func) {
    this.onSwipeDownAgent = func;
  }
  onTap (func) {
    this.onTapAgent = func;
  }
  onLongPress (func) {
    this.onLongPressAgent = func;
  }

  destroy () {
    this.element.removeEventListener('touchstart', this._onTouchStart);
    this.element.removeEventListener('touchmove', this._onTouchMove);
    this.element.removeEventListener('touchend', this._onTouchEnd);
    clearTimeout(this.longPressTimer);
  }

  handleGesture () {
    const x = this.touchEndX - this.touchStartX;
    const y = this.touchEndY - this.touchStartY;
    const xy = Math.abs(x / y);
    const yx = Math.abs(y / x);
    if (Math.abs(x) > this.threshold || Math.abs(y) > this.threshold) {
      if (yx <= this.limit) {
        if (x < 0) {
          // Left swipe.
          if (this.velocityX < -this.velocityThreshold || x < -this.disregardVelocityThresholdX) {
            this.onSwipeLeftAgent && this.onSwipeLeftAgent();
          }
        } else {
          // Right swipe.
          if (this.velocityX > this.velocityThreshold || x > this.disregardVelocityThresholdX) {
            this.onSwipeRightAgent && this.onSwipeRightAgent();
          }
        }
      }
      if (xy <= this.limit) {
        if (y < 0) {
          // Upward swipe.
          if (this.velocityY < -this.velocityThreshold || y < -this.disregardVelocityThresholdY) {
            this.onSwipeUpAgent && this.onSwipeUpAgent();
          }
        } else {
          // Downward swipe.
          if (this.velocityY > this.velocityThreshold || y > this.disregardVelocityThresholdY) {
            this.onSwipeDownAgent && this.onSwipeDownAgent();
          }
        }
      }
    } else {
      // Tap.
      this.onTapAgent && this.onTapAgent();
    }
  }
}

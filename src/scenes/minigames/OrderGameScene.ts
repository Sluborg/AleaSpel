import { runChallenge } from './challenges';
import { PLAY_BOTTOM, PLAY_TOP, QuickGameScene } from './QuickGameScene';

// Sifferhopp and Bokstavsjakt (`variant` numbers or letters): tap the tiles in order.
export class OrderGameScene extends QuickGameScene {
  constructor() {
    super('OrderGame');
  }

  protected playRound(roundNo: number): void {
    runChallenge(this.def.variant === 'letters' ? 'letters' : 'numbers', {
      scene: this,
      layer: this.layer,
      level: this.level,
      step: roundNo,
      top: PLAY_TOP,
      bottom: PLAY_BOTTOM,
      done: (stars) => this.roundDone(stars),
    });
  }
}

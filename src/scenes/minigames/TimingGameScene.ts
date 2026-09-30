import { runChallenge } from './challenges';
import { PLAY_BOTTOM, PLAY_TOP, QuickGameScene } from './QuickGameScene';

// Pricka rätt: stop the sliding marker on the line; faster and narrower every round and level.
export class TimingGameScene extends QuickGameScene {
  constructor() {
    super('TimingGame');
  }

  protected playRound(roundNo: number): void {
    runChallenge('timing', {
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

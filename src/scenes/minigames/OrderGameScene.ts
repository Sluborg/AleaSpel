import { runChallenge, type ChallengeKind } from './challenges';
import { PLAY_BOTTOM, PLAY_TOP, QuickGameScene } from './QuickGameScene';

// One scene for the warm-ups that are a single challenge per round, picked by the row's
// `variant`: Sifferhopp (numbers), Bokstavsjakt (letters), Para ihop (pairs).
export class OrderGameScene extends QuickGameScene {
  constructor() {
    super('OrderGame');
  }

  protected playRound(roundNo: number): void {
    runChallenge((this.def.variant ?? 'numbers') as ChallengeKind, {
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

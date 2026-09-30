import { randomPad, runChallenge } from './challenges';
import { PLAY_BOTTOM, PLAY_TOP, QuickGameScene } from './QuickGameScene';

// Färgminne: like Simon, the row of colours is kept and grows by one each round. Higher levels
// start with a longer row.
export class ColorMemoryScene extends QuickGameScene {
  private seq: number[] = [];

  constructor() {
    super('ColorMemory');
  }

  protected playRound(roundNo: number): void {
    if (roundNo === 1) this.seq = Array.from({ length: this.level }, randomPad);
    this.seq.push(randomPad());
    runChallenge(
      'colors',
      {
        scene: this,
        layer: this.layer,
        level: this.level,
        step: roundNo,
        top: PLAY_TOP,
        bottom: PLAY_BOTTOM,
        done: (stars) => this.roundDone(stars),
      },
      this.seq,
    );
  }
}

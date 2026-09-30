import Phaser from 'phaser';
import { petSpecies } from '../data/pets';
import { PET_SVG_SIZE, petTextureKey } from './petSvg';

// A pet drawn from its two placeholder layers: tinted fur + untinted face.
export class PetView extends Phaser.GameObjects.Container {
  private fur: Phaser.GameObjects.Image;
  private face: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    species: string,
    color: number,
  ) {
    super(scene, x, y);
    scene.add.existing(this);
    const s = petSpecies(species).id;
    this.fur = scene.add.image(0, 0, petTextureKey(s, 'fur')).setTint(color);
    this.face = scene.add.image(0, 0, petTextureKey(s, 'face'));
    this.add([this.fur, this.face]);
    this.setScale(size / PET_SVG_SIZE);
    this.setSize(PET_SVG_SIZE, PET_SVG_SIZE);
  }

  setColor(color: number): void {
    this.fur.setTint(color);
  }
}

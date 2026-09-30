import Phaser from 'phaser';
import { petSpecies } from '../data/pets';
import { hasArt } from './art';
import { PET_SVG_SIZE, petTextureKey } from './petSvg';

// Delivered pet art: 1024x1024, feet on y = 940, centred (see docs/art-requests.md row 10).
const ART_SIZE = 1024;
const ART_Y_OFFSET = 60; // lines the art's feet up with the SVG placeholder's

// A pet drawn from two layers: tinted fur + untinted face. Uses the delivered art
// (`pet_<species>_fur/face`) when present, else the SVG placeholder.
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
    const art = hasArt(scene, `pet_${s}_fur`) && hasArt(scene, `pet_${s}_face`);
    const canvas = art ? ART_SIZE : PET_SVG_SIZE;
    const dy = art ? ART_Y_OFFSET : 0;
    this.fur = scene.add
      .image(0, dy, art ? `pet_${s}_fur` : petTextureKey(s, 'fur'))
      .setTint(color);
    this.face = scene.add.image(0, dy, art ? `pet_${s}_face` : petTextureKey(s, 'face'));
    this.add([this.fur, this.face]);
    this.setScale(size / canvas);
    this.setSize(canvas, canvas);
  }

  setColor(color: number): void {
    this.fur.setTint(color);
  }
}

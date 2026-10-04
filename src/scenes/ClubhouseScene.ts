import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { SaveService, type Position } from '../services/SaveService';
import { backdrop, hasArt, visibleBox } from '../ui/art';
import { createButton } from '../ui/Button';
import { GymnastView } from '../ui/GymnastView';
import { PetView } from '../ui/PetView';
import { petSpecies } from '../data/pets';
import type { FurnitureDef } from '../data/furniture';
import { trophyView } from '../ui/trophy';
import { ROOM_WORLD_W, RoomScene, pin, type Placeable } from './RoomScene';

const GYM_DOOR = 'ext_door_1';
const DOOR_X_IN = 140; // door centre, from the room's right edge
const DOOR_H = 300; // visible door height

const ROOM = { left: 20, top: 250, right: ROOM_WORLD_W - 20, bottom: GAME_HEIGHT - 20 };
const FLOOR_Y = 700;
const GYMNAST_H = 320; // pets are drawn to scale next to the gymnast (PetSpecies.roomSize)
const GYMNAST_KEY = 'gymnast'; // her spot is kept with the pets' spots

// Klubbstugan: the team's club house, joined to the gym. The team's pets live here (drag them
// around, tap one to care for it), the active gymnast hangs out, and a door leads to the gym.
export class ClubhouseScene extends RoomScene {
  protected readonly title = 'Klubbstugan';
  protected readonly furnitureRoom = 'clubhouse' as const;

  constructor() {
    super('Clubhouse');
  }

  protected bounds() {
    return ROOM;
  }

  protected drawRoom(): void {
    const g = this.add.graphics();
    const w = ROOM.right - ROOM.left;
    if (!backdrop(this, 'bg_clubhouse_room', ROOM)) {
      g.fillStyle(0xf7d9c4, 1).fillRect(ROOM.left, ROOM.top, w, FLOOR_Y - ROOM.top);
      // Bunting along the wall.
      for (let i = 0; i < 9; i++) {
        const x = ROOM.left + 40 + i * 80;
        g.fillStyle([0xff6fae, 0xffd84d, 0x7ed957, 0x5aa9ff][i % 4], 1);
        g.fillTriangle(x, ROOM.top + 20, x + 60, ROOM.top + 20, x + 30, ROOM.top + 70);
      }
      g.fillStyle(0xd9a27a, 1).fillRect(ROOM.left, FLOOR_Y, w, ROOM.bottom - FLOOR_Y);
      g.fillStyle(0xa86b3c, 1).fillRect(ROOM.left, FLOOR_Y - 12, w, 12);
    }
    // Door to the gym on the right wall, over the backdrop: the house door art standing on the
    // floor line, or a drawn door as the fallback.
    if (hasArt(this, GYM_DOOR)) {
      // Scale so the visible door (not the art's transparent margin) is DOOR_H tall.
      const box = visibleBox(this, GYM_DOOR);
      const img = this.add.image(ROOM.right - DOOR_X_IN, FLOOR_Y, GYM_DOOR);
      img.setScale(DOOR_H / ((box.bottom - box.top) * img.height)).setOrigin(0.5, box.bottom);
    } else {
      const door = this.add.graphics();
      door.fillStyle(0x8fd36b, 1).fillRoundedRect(ROOM.right - 150, FLOOR_Y - 250, 120, 250, 12);
      door.fillStyle(0x4a7a2a, 1).fillCircle(ROOM.right - 60, FLOOR_Y - 120, 8);
    }
  }

  private gymnastView?: GymnastView;
  private party?: Phaser.GameObjects.Container;

  protected afterBuild(): void {
    this.party = undefined;
    // Lagfest: unlocked by the team's first cup from Tävlingsdag.
    const unlocked = SaveService.get().team.trophies.length > 0;
    const fest = createButton(
      this,
      GAME_WIDTH - 115,
      GAME_HEIGHT - 80,
      'Fest',
      () => (unlocked ? this.toggleParty() : this.partyLocked()),
      {
        width: 200,
        height: 110,
        fontSize: 34,
        color: unlocked ? 0xb06bff : 0x6b5a85,
        icon: unlocked ? 'icon_party' : 'icon_lock',
        emoji: unlocked ? '🎉' : '🔒',
      },
    );
    pin(fest).setDepth(40000);

    // A sign over the door, so it reads as the way to the gym.
    const sign = this.add.container(ROOM.right - DOOR_X_IN, FLOOR_Y - DOOR_H - 40);
    const label = this.add
      .text(0, 0, '🤸 Gymmet', {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#3a2a4a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const board = this.add.graphics();
    board
      .fillStyle(0xffffff, 0.92)
      .fillRoundedRect(-label.width / 2 - 18, -26, label.width + 36, 52, 26);
    sign.add([board, label]);
    const door = this.add
      .zone(ROOM.right - DOOR_X_IN, FLOOR_Y - DOOR_H / 2, 200, DOOR_H)
      .setInteractive({ useHandCursor: true });
    door.on('pointerup', () => this.scene.start('Gym'));

    // No pet yet: a fixed button in the bottom bar (left of Fest), off the floor so furniture
    // never covers it.
    if (!SaveService.get().pets.length) {
      const get = createButton(
        this,
        195,
        GAME_HEIGHT - 80,
        'Hämta ett djur',
        () => this.scene.start('Pets'),
        { width: 340, height: 110, fontSize: 27 },
      );
      pin(get).setDepth(40000);
    }
  }

  private partyLocked(): void {
    const t = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 190,
        'Vinn en pokal i Tävlingsdag\nså får laget ha fest! 🏆',
        {
          fontFamily: FONT,
          fontSize: '30px',
          color: COLORS.text,
          align: 'center',
          stroke: '#3a2a4a',
          strokeThickness: 6,
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(40001);
    this.tweens.add({
      targets: t,
      alpha: 0,
      delay: 1800,
      duration: 400,
      onComplete: () => t.destroy(),
    });
  }

  // Lagfest: lights down, disco spots, confetti, the gymnast in her Fest look dances and the pets
  // hop. Tap Fest again to stop.
  private toggleParty(): void {
    if (this.party) return this.endParty();
    const gymnast = SaveService.activeGymnast();
    this.gymnastView?.refresh(gymnast, 'fest');
    const party = this.add.container(0, 0).setDepth(30000);
    this.party = party;
    const dark = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a0f2e, 0.45).setOrigin(0);
    party.add(dark);
    const colours = [0xff6fae, 0xffd84d, 0x7ec8ff, 0x9ad97a, 0xc9a2ff];
    colours.forEach((c, i) => {
      const spot = this.add.ellipse(120 + i * 120, 500, 220, 140, c, 0.28).setBlendMode('ADD');
      party.add(spot);
      this.tweens.add({
        targets: spot,
        x: { from: 80 + i * 60, to: GAME_WIDTH - 80 - i * 40 },
        y: { from: 420 + (i % 2) * 300, to: 1100 - (i % 3) * 200 },
        duration: 1200 + i * 250,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    });
    const confetti = this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        const bit = this.add
          .rectangle(
            Phaser.Math.Between(20, GAME_WIDTH - 20),
            150,
            14,
            22,
            Phaser.Utils.Array.GetRandom(colours),
          )
          .setAngle(Phaser.Math.Between(0, 180));
        party.add(bit);
        this.tweens.add({
          targets: bit,
          y: GAME_HEIGHT + 30,
          angle: '+=540',
          duration: Phaser.Math.Between(1800, 2800),
          onComplete: () => bit.destroy(),
        });
      },
    });
    party.setData('confetti', confetti);
    pin(party);
    // Dance: the gymnast cycles happy moves, pets hop to the beat.
    const dance = ['happy', 'jump', 'bow', 'happy'];
    let step = 0;
    const next = (): void => {
      if (!this.party || !this.gymnastView) return;
      void this.gymnastView.play(dance[step++ % dance.length]).then(next);
    };
    next();
    for (const obj of this.children.list) {
      if (!(obj instanceof Phaser.GameObjects.Container)) continue;
      const id = obj.getData('id') as string | undefined;
      if (!id?.startsWith('pet:') || id === `pet:${GYMNAST_KEY}`) continue;
      this.tweens.add({
        targets: obj,
        y: obj.y - 40,
        duration: 260,
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 250),
        ease: 'Sine.out',
      });
      obj.setData('partyY', obj.y);
    }
  }

  private endParty(): void {
    const party = this.party;
    this.party = undefined;
    (party?.getData('confetti') as Phaser.Time.TimerEvent | undefined)?.remove();
    // Looping disco and confetti tweens outlive their targets unless killed first.
    if (party) this.tweens.killTweensOf(party.list);
    party?.destroy();
    this.gymnastView?.stopMove();
    void this.gymnastView?.play('idle');
    this.gymnastView?.refresh(SaveService.activeGymnast(), 'chill');
    for (const obj of this.children.list) {
      if (!(obj instanceof Phaser.GameObjects.Container)) continue;
      const y = obj.getData('partyY') as number | undefined;
      if (y === undefined) continue;
      this.tweens.killTweensOf(obj);
      obj.setY(y).setData('partyY', undefined);
    }
  }

  // The Prisskåp shows how many cups the team has won and opens the trophy shelf.
  protected furnitureExtras(def: FurnitureDef): Phaser.GameObjects.GameObject[] {
    if (def.action !== 'trophies') return [];
    const count = SaveService.get().team.trophies.length;
    if (!count) return [];
    const badge = this.add.graphics();
    badge.fillStyle(COLORS.primary, 1).fillCircle(def.width / 2 - 14, -60, 26);
    const text = this.add
      .text(def.width / 2 - 14, -60, String(count), {
        fontFamily: FONT,
        fontSize: '28px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    return [badge, text];
  }

  protected furnitureAction(def: FurnitureDef) {
    if (def.action !== 'trophies') return undefined;
    return { label: '🏆 Visa pokaler', run: () => this.openTrophies() };
  }

  private openTrophies(): void {
    this.deselect();
    // Best first (gold, silver, bronze), newest first within each.
    const trophies = [...SaveService.get().team.trophies]
      .reverse()
      .sort((a, b) => a.place - b.place);
    const modal = this.add.container(0, 0).setDepth(60000);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5).setOrigin(0);
    shade.setInteractive();
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 1).fillRoundedRect(30, 150, GAME_WIDTH - 60, 1000, 36);
    const title = this.add
      .text(GAME_WIDTH / 2, 215, 'Prisskåpet', {
        fontFamily: FONT,
        fontSize: '52px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    modal.add([shade, bg, title]);
    if (!trophies.length) {
      modal.add(
        this.add
          .text(GAME_WIDTH / 2, 560, 'Inga pokaler än.\nVinn en plats på pallen\ni Tävlingsdag!', {
            fontFamily: FONT,
            fontSize: '36px',
            color: COLORS.textMuted,
            align: 'center',
          })
          .setOrigin(0.5),
      );
    }
    const perRow = 4;
    const cell = (GAME_WIDTH - 120) / perRow;
    trophies.slice(0, 16).forEach((t, i) => {
      const x = 60 + cell * ((i % perRow) + 0.5);
      const y = 360 + Math.floor(i / perRow) * 175;
      modal.add(trophyView(this, x, y, 135, t.place));
      modal.add(
        this.add
          .text(x, y + 82, t.date.slice(5), {
            fontFamily: FONT,
            fontSize: '22px',
            color: COLORS.textMuted,
          })
          .setOrigin(0.5),
      );
    });
    if (trophies.length > 16) {
      modal.add(
        this.add
          .text(GAME_WIDTH / 2, 1000, `+ ${trophies.length - 16} till`, {
            fontFamily: FONT,
            fontSize: '28px',
            color: COLORS.textMuted,
          })
          .setOrigin(0.5),
      );
    }
    modal.add(
      createButton(this, GAME_WIDTH / 2, 1080, 'Stäng', () => modal.destroy(), {
        width: 260,
        color: 0x6b5a85,
      }),
    );
    pin(modal);
  }

  protected placeables(): Placeable[] {
    const { clubhouse, pets } = SaveService.get();
    // The active gymnast hangs out here too: drag her, tap her for Mitt lag.
    const gymnast = SaveService.activeGymnast();
    const gPos = clubhouse.pets[GYMNAST_KEY] ?? { x: 130, y: FLOOR_Y + 60 };
    const gymnastItem: Placeable = {
      id: `pet:${GYMNAST_KEY}`,
      width: 150,
      height: GYMNAST_H,
      x: gPos.x,
      y: gPos.y,
      foot: GYMNAST_H * 0.47,
      build: () => {
        const view = new GymnastView(this, 0, 0, GYMNAST_H, gymnast, 'chill');
        this.gymnastView = view;
        void view.play('idle');
        this.children.remove(view); // the room container owns it
        return [view];
      },
      onTap: () => this.scene.start('AvatarEditor'),
    };
    const petItems = pets.map((pet, i): Placeable => {
      const size = Math.round(GYMNAST_H * petSpecies(pet.species).roomSize);
      const pos = clubhouse.pets[pet.id] ?? {
        x: 300 + (i % 3) * 140,
        y: 900 + Math.floor(i / 3) * 120,
      };
      return {
        id: `pet:${pet.id}`,
        width: size * 0.7,
        height: size * 0.9,
        x: pos.x,
        y: pos.y,
        build: () => {
          const view = new PetView(this, 0, 0, size, pet.species, pet.color);
          this.children.remove(view); // the room container owns it
          const name = this.add
            .text(0, size * 0.45 + 14, pet.name, {
              fontFamily: FONT,
              fontSize: '24px',
              color: '#3a2a4a',
              fontStyle: 'bold',
            })
            .setOrigin(0.5);
          return [view, name];
        },
        foot: size * 0.47,
        onTap: () => this.scene.start('Pets', { petId: pet.id }),
      };
    });
    return [gymnastItem, ...petItems];
  }

  protected savePosition(id: string, pos: Position): void {
    SaveService.update((data) => {
      if (id.startsWith('pet:')) data.clubhouse.pets[id.slice(4)] = pos;
    });
  }
}

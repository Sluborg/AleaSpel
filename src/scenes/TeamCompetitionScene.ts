import Phaser from 'phaser';
import { COLORS, FONT, GAME_WIDTH } from '../config';
import { iconOrEmoji } from '../ui/art';
import {
  PLACEMENT_ICONS,
  PLACEMENT_MEDALS,
  RIVAL_TEAMS,
  TEAM_NAME,
  type RivalTeam,
} from '../data/competition';
import { APPARATUS_GAMES } from '../data/minigames';
import { localDate, SaveService } from '../services/SaveService';
import { createButton } from '../ui/Button';
import { BaseScene } from './BaseScene';

// One gymnast's routine in the team competition.
export interface TeamResult {
  gymnastId: string;
  gameId: string;
  stars: number;
  max: number;
}

interface TeamDay {
  results: TeamResult[];
  finished: boolean;
}

const REGISTRY_KEY = 'teamDay';
const ROW_Y = 300;
const ROW_H = 96;

// Tävlingsdag: every gymnast in the team performs one routine (apparatus rotate), the stars are
// added up and compared with three rival clubs. Placement gives medals. State lives in the
// Phaser registry while the routines run in the minigame scenes.
export class TeamCompetitionScene extends BaseScene {
  constructor() {
    super('TeamCompetition');
  }

  create(data: { fresh?: boolean; result?: TeamResult }): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.addTitle('Tävlingsdag');
    this.addBackButton('MinigameHub');

    let day = this.registry.get(REGISTRY_KEY) as TeamDay | undefined;
    if (data.fresh || !day) day = { results: [], finished: false };
    if (data.result && !day.finished) {
      day.results = day.results.filter((r) => r.gymnastId !== data.result!.gymnastId);
      day.results.push(data.result);
    }
    this.registry.set(REGISTRY_KEY, day);

    const gymnasts = SaveService.get().gymnasts;
    const lineup = gymnasts.map((g, i) => ({
      gymnast: g,
      game: APPARATUS_GAMES[i % APPARATUS_GAMES.length],
    }));
    const next = lineup.find((l) => !day.results.some((r) => r.gymnastId === l.gymnast.id));

    if (!next && !day.finished) {
      day.finished = true;
      this.registry.set(REGISTRY_KEY, day);
      this.showResults(day);
      return;
    }
    if (day.finished) {
      this.showResults(day, true);
      return;
    }

    this.add
      .text(GAME_WIDTH / 2, 175, `Du möter ${RIVAL_TEAMS.length} lag!`, {
        fontFamily: FONT,
        fontSize: '36px',
        color: '#ffd84d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 225, 'Alla i laget får hoppa en gång', {
        fontFamily: FONT,
        fontSize: '28px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);

    lineup.forEach((l, i) => {
      const y = ROW_Y + i * ROW_H;
      const done = day.results.find((r) => r.gymnastId === l.gymnast.id);
      const current = l === next;
      this.add
        .graphics()
        .fillStyle(current ? 0x4a3266 : 0x3a2752, 1)
        .fillRoundedRect(40, y - 40, GAME_WIDTH - 80, 84, 24);
      iconOrEmoji(this, 100, y, `icon_game_${l.game.id}`, l.game.icon, 64);
      const row = this.add
        .text(150, y, `${l.gymnast.name} · ${l.game.name}`, {
          fontFamily: FONT,
          fontSize: '34px',
          color: COLORS.text,
          fontStyle: current ? 'bold' : 'normal',
        })
        .setOrigin(0, 0.5);
      // Leave room for the result on the right (stars, Nu!).
      row.setScale(Math.min(1, (GAME_WIDTH - 150 - 170) / row.width));
      this.add
        .text(GAME_WIDTH - 70, y, done ? `${done.stars} ⭐` : current ? 'Nu!' : '…', {
          fontFamily: FONT,
          fontSize: '34px',
          color: done ? '#ffd84d' : COLORS.textMuted,
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);
    });

    this.rivals(ROW_Y + lineup.length * ROW_H + 30);

    if (next) {
      createButton(
        this,
        GAME_WIDTH / 2,
        1170,
        'Kör!',
        () =>
          this.scene.start(next.game.scene, {
            gymnastId: next.gymnast.id,
            team: true,
            returnTo: 'TeamCompetition',
          }),
        { width: 560 },
      );
    }
  }

  // The rival clubs as badges, so a small team still has something to look at. Skipped when a
  // big team's line-up leaves no room above the Kör! button.
  private rivals(top: number): void {
    if (top + 230 > 1090) return;
    this.add
      .text(GAME_WIDTH / 2, top, 'Dagens motståndare', {
        fontFamily: FONT,
        fontSize: '30px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);
    RIVAL_TEAMS.forEach((t, i) => {
      const x = GAME_WIDTH / 2 + (i - (RIVAL_TEAMS.length - 1) / 2) * 215;
      const y = top + 110;
      const badge = this.add.container(x, y);
      badge.add([
        this.add.circle(0, 0, 62, t.color),
        this.add.circle(0, 0, 62).setStrokeStyle(6, 0xffffff, 0.8),
        this.add.text(0, 2, t.icon, { fontSize: '56px' }).setOrigin(0.5),
        this.add
          .text(0, 92, t.name, {
            fontFamily: FONT,
            fontSize: '26px',
            color: COLORS.text,
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      ]);
      this.tweens.add({
        targets: badge,
        y: y - 8,
        duration: 900 + i * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    });
  }

  // Standings: rivals draw a random share of the same maximum. Rewards are saved once.
  private showResults(day: TeamDay, replay = false): void {
    const ours = day.results.reduce((s, r) => s + r.stars, 0);
    const max = Math.max(
      1,
      day.results.reduce((s, r) => s + r.max, 0),
    );
    const rng = new Phaser.Math.RandomDataGenerator([day.results.map((r) => r.stars).join(',')]);
    const rows: { name: string; color: number; score: number; team?: RivalTeam }[] =
      RIVAL_TEAMS.map((t) => ({
        name: t.name,
        color: t.color,
        score: Math.round(max * rng.realInRange(t.skill[0], t.skill[1])),
        team: t,
      }));
    rows.push({ name: TEAM_NAME, color: COLORS.primary, score: ours });
    rows.sort((a, b) => b.score - a.score || (a.team ? 1 : -1));
    const place = rows.findIndex((r) => !r.team);
    const reward = PLACEMENT_MEDALS[place] ?? 0;
    if (!replay) {
      SaveService.update((d) => {
        d.medals += reward;
        d.team.days += 1;
        if (place === 0) d.team.wins += 1;
        if (place < 3) {
          d.team.podiums += 1;
          d.team.trophies.push({
            place: (place + 1) as 1 | 2 | 3,
            date: localDate(),
          });
        }
      });
    }

    this.add
      .text(GAME_WIDTH / 2, 190, `${PLACEMENT_ICONS[place]} ${place + 1}:a plats!`, {
        fontFamily: FONT,
        fontSize: '56px',
        color: '#ffd84d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    rows.forEach((r, i) => {
      const y = 320 + i * 110;
      const mine = !r.team;
      this.add
        .graphics()
        .fillStyle(mine ? 0x5a3a7a : 0x3a2752, 1)
        .fillRoundedRect(40, y - 45, GAME_WIDTH - 80, 94, 24);
      this.add.rectangle(85, y, 30, 30, r.color).setOrigin(0.5);
      this.add
        .text(130, y, `${PLACEMENT_ICONS[i]} ${r.name}`, {
          fontFamily: FONT,
          fontSize: '36px',
          color: COLORS.text,
          fontStyle: mine ? 'bold' : 'normal',
        })
        .setOrigin(0, 0.5);
      this.add
        .text(GAME_WIDTH - 70, y, `${r.score} ⭐`, {
          fontFamily: FONT,
          fontSize: '36px',
          color: '#ffd84d',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);
    });

    const save = SaveService.get();
    this.add
      .text(GAME_WIDTH / 2, 800, `+${reward} 🏅 till laget`, {
        fontFamily: FONT,
        fontSize: '48px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(
        GAME_WIDTH / 2,
        870,
        place < 3
          ? 'Ny pokal i Prisskåpet i Klubbstugan! 🏆'
          : `Du har ${save.medals} medaljer · ${save.team.wins} vinster av ${save.team.days} tävlingar`,
        { fontFamily: FONT, fontSize: '28px', color: COLORS.textMuted },
      )
      .setOrigin(0.5);

    const opts = { width: 280 };
    createButton(
      this,
      GAME_WIDTH / 2 - 160,
      1170,
      'Igen',
      () => this.scene.restart({ fresh: true }),
      opts,
    );
    createButton(this, GAME_WIDTH / 2 + 160, 1170, 'Klar', () => this.scene.start('MinigameHub'), {
      ...opts,
      color: 0x6b5a85,
    });
  }
}

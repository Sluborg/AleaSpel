// Placeholder pet art as SVG generated in code. Two layers per species:
//   fur  = white shapes, tinted with the pet's colour in the game (multiply tint)
//   face = eyes, nose, blush, inner ears; never tinted
import type { PetSpecies } from '../data/pets';

export const PET_SVG_SIZE = 400;
const OUTLINE = 'stroke="#cbbfb6" stroke-width="6" stroke-linejoin="round"';
const FUR = `fill="#ffffff" ${OUTLINE}`;

export const petTextureKey = (speciesId: string, layer: 'fur' | 'face') =>
  `pet_${speciesId}_${layer}`;

function geometry(s: PetSpecies) {
  const headY = 165;
  const bodyY = 290;
  return { headY, bodyY, r: s.headR, bw: s.bodyW, bh: s.bodyH };
}

function ears(s: PetSpecies, layer: 'fur' | 'face'): string {
  const { headY, r } = geometry(s);
  const inner = layer === 'face';
  const fill = inner ? 'fill="#f7a9c4"' : FUR;
  switch (s.ears) {
    case 'cat': {
      const tri = (dir: number) => {
        const k = inner ? 0.55 : 1;
        const bx = 200 + dir * r * 0.62;
        const by = headY - r * 0.55;
        const pts = [
          [bx - dir * 34 * k, by + 18 * k],
          [bx + dir * 8 * k, by - 70 * k],
          [bx + dir * 44 * k, by + 4 * k],
        ];
        return `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" ${fill}/>`;
      };
      return tri(-1) + tri(1);
    }
    case 'rabbit': {
      const ear = (dir: number) =>
        `<ellipse cx="${200 + dir * 34}" cy="${headY - r - 22}" rx="${inner ? 12 : 26}" ry="${inner ? 40 : 58}" transform="rotate(${dir * 8} ${200 + dir * 34} ${headY - r - 22})" ${fill}/>`;
      return ear(-1) + ear(1);
    }
    case 'round': {
      const ear = (dir: number) =>
        `<circle cx="${200 + dir * r * 0.7}" cy="${headY - r * 0.7}" r="${inner ? 14 : 28}" ${fill}/>`;
      return ear(-1) + ear(1);
    }
    case 'pony': {
      if (inner) return '';
      const ear = (dir: number) =>
        `<ellipse cx="${200 + dir * r * 0.5}" cy="${headY - r * 0.95}" rx="18" ry="40" transform="rotate(${dir * 18} ${200 + dir * r * 0.5} ${headY - r * 0.95})" ${fill}/>`;
      return ear(-1) + ear(1);
    }
    case 'dog': {
      if (inner) return '';
      const ear = (dir: number) =>
        `<ellipse cx="${200 + dir * r * 0.92}" cy="${headY + 10}" rx="30" ry="62" transform="rotate(${dir * -14} ${200 + dir * r * 0.92} ${headY + 10})" ${fill}/>`;
      return ear(-1) + ear(1);
    }
  }
}

function tail(s: PetSpecies): string {
  const g = geometry(s);
  const bw = g.bw;
  const bodyY = s.pose === 'sit' ? g.bodyY + g.bh * 0.9 : g.bodyY;
  const x = 200 + bw - 10;
  switch (s.tail) {
    case 'cat':
      return `<path d="M${x} ${bodyY} C ${x + 70} ${bodyY - 10}, ${x + 60} ${bodyY - 110}, ${x + 20} ${bodyY - 120}" fill="none" stroke="#cbbfb6" stroke-width="30" stroke-linecap="round"/><path d="M${x} ${bodyY} C ${x + 70} ${bodyY - 10}, ${x + 60} ${bodyY - 110}, ${x + 20} ${bodyY - 120}" fill="none" stroke="#ffffff" stroke-width="20" stroke-linecap="round"/>`;
    case 'dog':
      return `<path d="M${x} ${bodyY - 20} Q ${x + 50} ${bodyY - 40}, ${x + 40} ${bodyY - 90}" fill="none" stroke="#cbbfb6" stroke-width="28" stroke-linecap="round"/><path d="M${x} ${bodyY - 20} Q ${x + 50} ${bodyY - 40}, ${x + 40} ${bodyY - 90}" fill="none" stroke="#ffffff" stroke-width="18" stroke-linecap="round"/>`;
    case 'puff':
      return `<circle cx="${x + 14}" cy="${bodyY + 10}" r="28" ${FUR}/>`;
    case 'pony':
      return `<path d="M${x} ${bodyY - 30} C ${x + 60} ${bodyY - 20}, ${x + 50} ${bodyY + 60}, ${x + 30} ${bodyY + 90}" fill="none" stroke="#cbbfb6" stroke-width="34" stroke-linecap="round"/><path d="M${x} ${bodyY - 30} C ${x + 60} ${bodyY - 20}, ${x + 50} ${bodyY + 60}, ${x + 30} ${bodyY + 90}" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round"/>`;
    case 'none':
      return '';
  }
}

export function petSvg(s: PetSpecies, layer: 'fur' | 'face'): string {
  const { headY, bodyY, r, bw, bh } = geometry(s);
  let body: string;
  if (layer === 'fur') {
    if (s.pose === 'stand') {
      const legs = 44;
      const foot = (x: number) =>
        `<rect x="${x - 20}" y="${bodyY + bh - 30}" width="40" height="${legs + 30}" rx="18" ${FUR}/>`;
      body =
        tail(s) +
        foot(200 - bw * 0.6) +
        foot(200 + bw * 0.6) +
        foot(200 - bw * 0.2) +
        foot(200 + bw * 0.2) +
        `<ellipse cx="200" cy="${bodyY}" rx="${bw}" ry="${bh}" ${FUR}/>` +
        ears(s, 'fur') +
        `<circle cx="200" cy="${headY}" r="${r}" ${FUR}/>` +
        `<path d="M${200 - 30} ${headY - r + 6} q 30 -40 60 0 q -30 20 -60 0z" fill="#ffffff" ${OUTLINE}/>`;
    } else {
      // Sitting: round body, haunches on the sides, front paws together, tail on the floor.
      const sy = bodyY + 10;
      const haunch = (dir: number) =>
        `<ellipse cx="${200 + dir * bw * 0.62}" cy="${sy + bh * 0.55}" rx="${bw * 0.48}" ry="${bh * 0.62}" ${FUR}/>`;
      const paw = (dir: number) =>
        `<ellipse cx="${200 + dir * 30}" cy="${sy + bh * 1.02}" rx="30" ry="20" ${FUR}/>`;
      body =
        tail(s) +
        haunch(-1) +
        haunch(1) +
        `<ellipse cx="200" cy="${sy}" rx="${bw * 0.82}" ry="${bh * 1.18}" ${FUR}/>` +
        `<rect x="${200 - 46}" y="${sy + 10}" width="36" height="${bh * 0.95}" rx="18" ${FUR}/>` +
        `<rect x="${200 + 10}" y="${sy + 10}" width="36" height="${bh * 0.95}" rx="18" ${FUR}/>` +
        paw(-1) +
        paw(1) +
        ears(s, 'fur') +
        `<circle cx="200" cy="${headY}" r="${r}" ${FUR}/>`;
    }
  } else {
    const ex = r * 0.4;
    const ey = headY + r * 0.02;
    const eye = (x: number) =>
      `<ellipse cx="${x}" cy="${ey}" rx="15" ry="19" fill="#2b2233"/><circle cx="${x + 5}" cy="${ey - 7}" r="6" fill="#ffffff"/><circle cx="${x - 5}" cy="${ey + 6}" r="3" fill="#ffffff"/>`;
    const snout = s.snout
      ? `<ellipse cx="200" cy="${headY + r * 0.45}" rx="${r * 0.46}" ry="${r * 0.32}" fill="#fff8f0" opacity="0.85"/>`
      : '';
    const chest =
      s.pose === 'sit'
        ? `<ellipse cx="200" cy="${bodyY - 5}" rx="${bw * 0.42}" ry="${bh * 0.7}" fill="#fff8f0" opacity="0.55"/>`
        : '';
    body =
      chest +
      ears(s, 'face') +
      snout +
      eye(200 - ex) +
      eye(200 + ex) +
      `<ellipse cx="${200 - ex - 12}" cy="${ey + 32}" rx="18" ry="10" fill="#ff9fc0" opacity="0.7"/>` +
      `<ellipse cx="${200 + ex + 12}" cy="${ey + 32}" rx="18" ry="10" fill="#ff9fc0" opacity="0.7"/>` +
      `<ellipse cx="200" cy="${headY + r * 0.34}" rx="10" ry="7" fill="#e9738f"/>` +
      `<path d="M188 ${headY + r * 0.46} q 6 8 12 0 q 6 8 12 0" fill="none" stroke="#6b4a55" stroke-width="4" stroke-linecap="round"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PET_SVG_SIZE}" height="${PET_SVG_SIZE}" viewBox="0 0 ${PET_SVG_SIZE} ${PET_SVG_SIZE}">${body}</svg>`;
}

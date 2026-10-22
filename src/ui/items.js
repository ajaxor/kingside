// Icons for every kind of item: the four resources, the goods that equip troops and towers, and the people and charges that fill the
// slots of a building. Each is a small flat SVG on a 16x16 grid, so it can sit in a cost line, the stockpile bar or a slot, and
// (as a silhouette, see `.slot.empty` in style.css) stand for an empty slot.

const PATHS = {
  wood: '<rect x="1.5" y="3" width="13" height="4.4" rx="2.2" fill="#b07a47"/><rect x="1.5" y="8.6" width="13" height="4.4" rx="2.2" fill="#9a6a3e"/><circle cx="3.7" cy="5.2" r="1.7" fill="#e3c08f"/><circle cx="3.7" cy="10.8" r="1.7" fill="#e3c08f"/><circle cx="3.7" cy="5.2" r=".7" fill="#a5773f"/><circle cx="3.7" cy="10.8" r=".7" fill="#a5773f"/>',
  stone: '<path d="M2 11.5 4.2 5 8.5 2.5 13 5.4 14 11 10.5 13.8 5 13.6Z" fill="#a7a9ad"/><path d="M4.2 5 8.5 2.5 13 5.4 8.4 7.2Z" fill="#d9dbde"/><path d="M8.4 7.2 13 5.4 14 11 10.5 13.8Z" fill="#8c8f94"/>',
  food: '<path d="M8 15V6" stroke="#8a6a1e" stroke-width="1.2" stroke-linecap="round"/><g fill="#f0c53a"><ellipse cx="8" cy="3.4" rx="1.5" ry="2.3"/><ellipse cx="5.5" cy="6" rx="1.4" ry="2.2" transform="rotate(-28 5.5 6)"/><ellipse cx="10.5" cy="6" rx="1.4" ry="2.2" transform="rotate(28 10.5 6)"/><ellipse cx="5.6" cy="9.3" rx="1.3" ry="2" transform="rotate(-28 5.6 9.3)"/><ellipse cx="10.4" cy="9.3" rx="1.3" ry="2" transform="rotate(28 10.4 9.3)"/></g>',
  iron: '<path d="M1.5 12.5 4 6h8l2.5 6.5Z" fill="#7d93a8"/><path d="M4 6h8l-.8 2H4.8Z" fill="#c5d3df"/><path d="M1.5 12.5 4.8 8h6.4l3.3 4.5Z" fill="#5f7488"/>',
  arrows: '<path d="M2 14 12.6 3.4" stroke="#8a5f36" stroke-width="1.3" stroke-linecap="round"/><path d="M14.5 1.5 10.2 3 13 5.8Z" fill="#9fb0c0"/><path d="M2 14 2 10.2 5.8 14ZM3.6 12.4 3.6 9 7 12.4Z" fill="#e8e3d4"/>',
  bows: '<path d="M4 1.5C12.6 4 12.6 12 4 14.5" fill="none" stroke="#9a6a3e" stroke-width="1.7" stroke-linecap="round"/><path d="M4 1.5V14.5" stroke="#efe7d2" stroke-width=".8"/>',
  weapons: '<path d="M13.4 1.6 14.4 2.6 6.6 10.4 5.6 9.4Z" fill="#cfd8e0"/><path d="M3.4 8.2 7.8 12.6" stroke="#9a6a3e" stroke-width="1.7" stroke-linecap="round"/><path d="M2 14 4.6 11.4" stroke="#6b4a2a" stroke-width="1.9" stroke-linecap="round"/><path d="M5.2 6.6 9.4 10.8" stroke="#b7a66a" stroke-width="1.3"/>',
  parts: '<g fill="#8a8fa6"><circle cx="8" cy="8" r="4.3"/><rect x="6.8" y="1.2" width="2.4" height="3"/><rect x="6.8" y="11.8" width="2.4" height="3"/><rect x="1.2" y="6.8" width="3" height="2.4"/><rect x="11.8" y="6.8" width="3" height="2.4"/></g><circle cx="8" cy="8" r="1.9" fill="#d3d6e2"/>',
  worker: '<circle cx="8" cy="4.3" r="2.5" fill="#f0c9a8"/><path d="M3.6 14.5V10a4.4 4.4 0 0 1 8.8 0v4.5Z" fill="#7d8bc4"/>',
  spike: '<path d="M2 14 4.2 6 6.4 14ZM6 14 8 3 10 14ZM9.6 14 11.8 6 14 14Z" fill="#b9c4cf"/><path d="M1.5 14h13" stroke="#6f7a85" stroke-width="1.2"/>',
};

export const ITEM_IDS = Object.keys(PATHS);

/** The markup of the icon for an item id (a resource, a good, 'worker' or 'spike'); `cls` adds classes to the svg. */
export const itemIcon = (id, cls = '') => `<svg class="ic ${id} ${cls}" viewBox="0 0 16 16" aria-hidden="true">${PATHS[id] || ''}</svg>`;

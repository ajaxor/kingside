// Goods are made by production buildings and carried by runners to whoever needs them. Arrows go to towers; the rest are the
// equipment a training building needs for each soldier or machine. `source` is how the player is told where to get one.

export const GOODS = {
  arrows: { name: 'arrows', source: 'a Fletcher', carry: 'straw' },
  bows: { name: 'bows', source: 'a Fletcher', carry: 'wood' },
  weapons: { name: 'weapons', source: 'a Blacksmith', carry: 'steel' },
  parts: { name: 'parts', source: "an Engineer's Yard", carry: 'steel' },
};

// Words for messages.

/** "Footman" -> "Footmen", "Archer" -> "Archers". */
export const plural = (name) => (/man$/.test(name) ? name.slice(0, -3) + 'men' : name + 's');

/** { wood: 30, stone: 10 } -> "30 wood, 10 stone" */
export const costText = (cost, names) => Object.keys(cost).map((r) => cost[r] + ' ' + names[r]).join(', ');

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

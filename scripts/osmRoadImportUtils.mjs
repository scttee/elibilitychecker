export const buildOverpassRoadQuery = ({ relationId }) => `
[out:json][timeout:120];
relation(${relationId});
map_to_area->.searchArea;
(
  way["highway"]["name"](area.searchArea);
);
out tags;
`.trim()

export const normaliseRoadName = (value) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

export const extractRoadNamesFromOsmElements = (elements = []) => {
  const names = new Set()
  for (const element of elements) {
    const name = element?.tags?.name
    if (typeof name === 'string' && name.trim()) {
      names.add(normaliseRoadName(name))
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

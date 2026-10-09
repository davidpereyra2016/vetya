const toRadians = degrees => degrees * Math.PI / 180;

export const distanceMeters = (a, b) => {
  const lat1 = toRadians(a.latitude), lat2 = toRadians(b.latitude);
  const deltaLat = lat2 - lat1, deltaLon = toRadians(b.longitude - a.longitude);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

class MinHeap {
  items = [];
  push(id, score) {
    const item = { id, score };
    let i = this.items.length;
    this.items.push(item);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent].score <= score) break;
      this.items[i] = this.items[parent];
      i = parent;
    }
    this.items[i] = item;
  }
  pop() {
    if (!this.items.length) return null;
    const result = this.items[0];
    const last = this.items.pop();
    if (!this.items.length) return result;
    let i = 0;
    while (true) {
      let child = i * 2 + 1;
      if (child >= this.items.length) break;
      if (child + 1 < this.items.length && this.items[child + 1].score < this.items[child].score) child++;
      if (last.score <= this.items[child].score) break;
      this.items[i] = this.items[child];
      i = child;
    }
    this.items[i] = last;
    return result;
  }
  get size() { return this.items.length; }
}

const coordinate = node => ({ latitude: node[0], longitude: node[1] });

export function findRoadRoute(graph, start, end, maxSnapMeters = 2000) {
  const nodes = graph?.nodes;
  if (!Array.isArray(nodes) || !nodes.length || !start || !end) return null;
  let first = -1, last = -1, firstDistance = Infinity, lastDistance = Infinity;
  for (let i = 0; i < nodes.length; i++) {
    const point = coordinate(nodes[i]);
    const fromStart = distanceMeters(start, point);
    const fromEnd = distanceMeters(end, point);
    if (fromStart < firstDistance) { first = i; firstDistance = fromStart; }
    if (fromEnd < lastDistance) { last = i; lastDistance = fromEnd; }
  }
  if (firstDistance > maxSnapMeters || lastDistance > maxSnapMeters) return null;

  const scores = new Float64Array(nodes.length);
  scores.fill(Infinity);
  const previous = new Int32Array(nodes.length);
  previous.fill(-1);
  const closed = new Uint8Array(nodes.length);
  const heap = new MinHeap();
  const target = coordinate(nodes[last]);
  scores[first] = 0;
  heap.push(first, distanceMeters(coordinate(nodes[first]), target));
  while (heap.size) {
    const entry = heap.pop();
    const current = entry.id;
    if (closed[current]) continue;
    if (current === last) {
      const route = [];
      for (let at = last; at !== -1; at = previous[at]) route.push(coordinate(nodes[at]));
      route.reverse();
      return {
        coordinates: [start, ...route, end],
        distanceMeters: scores[last] + firstDistance + lastDistance,
        snapMeters: Math.max(firstDistance, lastDistance),
      };
    }
    closed[current] = 1;
    const from = coordinate(nodes[current]);
    for (const neighbor of nodes[current][2]) {
      if (closed[neighbor]) continue;
      const to = coordinate(nodes[neighbor]);
      const score = scores[current] + distanceMeters(from, to);
      if (score < scores[neighbor]) {
        scores[neighbor] = score;
        previous[neighbor] = current;
        heap.push(neighbor, score + distanceMeters(to, target));
      }
    }
  }
  return null;
}

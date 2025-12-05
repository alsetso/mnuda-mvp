/**
 * Simple clustering utility for grouping nearby pins based on zoom level
 * Uses a grid-based approach for efficient clustering
 */

export interface ClusterPoint {
  id: string;
  lat: number;
  lng: number;
  pin?: any; // Original pin data
}

export interface Cluster {
  id: string;
  lat: number;
  lng: number;
  pointCount: number;
  points: ClusterPoint[];
  isCluster: boolean;
}

/**
 * Calculate distance between two points in pixels at a given zoom level
 * Uses Web Mercator projection approximation
 */
function getPixelDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  zoom: number
): number {
  // Web Mercator projection: convert lat/lng to pixel coordinates
  // At zoom 0, world is 256x256 pixels
  // At zoom z, world is 256 * 2^z pixels
  
  const worldSize = 256 * Math.pow(2, zoom);
  
  // Convert latitude to pixel Y (Web Mercator)
  const latToPixelY = (lat: number) => {
    const sinLat = Math.sin(lat * Math.PI / 180);
    const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
    return y * worldSize;
  };
  
  // Convert longitude to pixel X (simple linear)
  const lngToPixelX = (lng: number) => {
    return (lng + 180) / 360 * worldSize;
  };
  
  const x1 = lngToPixelX(lng1);
  const y1 = latToPixelY(lat1);
  const x2 = lngToPixelX(lng2);
  const y2 = latToPixelY(lat2);
  
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

/**
 * Cluster points based on zoom level
 * Points closer than CLUSTER_RADIUS pixels will be grouped together
 * Uses strict thresholds to ensure pins stay at exact coordinates until truly overlapping
 */
export function clusterPins(
  points: ClusterPoint[],
  zoom: number,
  clusterRadius: number = 50 // pixels
): Cluster[] {
  if (points.length === 0) return [];

  // Only cluster at lower zoom levels (when zoomed out)
  // At zoom 10+, show all pins individually at exact coordinates
  // At zoom 8-10, use very strict clustering (only overlapping pins)
  // At zoom < 8, use slightly more lenient clustering
  let adjustedRadius: number;
  if (zoom >= 10) {
    // High zoom: no clustering, show all pins at exact coordinates
    adjustedRadius = 0;
  } else if (zoom >= 8) {
    // Medium zoom: very strict clustering (only truly overlapping pins)
    adjustedRadius = 15; // Very small - only pins that are almost on top of each other
  } else if (zoom >= 5) {
    // Medium-low zoom: strict clustering
    adjustedRadius = clusterRadius * 0.5; // Half the base radius
  } else {
    // Low zoom: allow more clustering
    adjustedRadius = clusterRadius;
  }

  const clusters: Cluster[] = [];
  const processed = new Set<string>();

  for (const point of points) {
    if (processed.has(point.id)) continue;

    // Find all nearby points
    const nearbyPoints: ClusterPoint[] = [point];
    processed.add(point.id);

    for (const otherPoint of points) {
      if (processed.has(otherPoint.id)) continue;

      const distance = getPixelDistance(
        point.lat,
        point.lng,
        otherPoint.lat,
        otherPoint.lng,
        zoom
      );

      // Only cluster if distance is strictly less than threshold
      if (distance < adjustedRadius) {
        nearbyPoints.push(otherPoint);
        processed.add(otherPoint.id);
      }
    }

    // Create cluster or single point
    if (nearbyPoints.length > 1) {
      // Calculate centroid only for actual clusters
      const avgLat = nearbyPoints.reduce((sum, p) => sum + p.lat, 0) / nearbyPoints.length;
      const avgLng = nearbyPoints.reduce((sum, p) => sum + p.lng, 0) / nearbyPoints.length;

      clusters.push({
        id: `cluster-${point.id}`,
        lat: avgLat,
        lng: avgLng,
        pointCount: nearbyPoints.length,
        points: nearbyPoints,
        isCluster: true,
      });
    } else {
      // Single point (not clustered) - use exact coordinates
      clusters.push({
        id: point.id,
        lat: point.lat,
        lng: point.lng,
        pointCount: 1,
        points: [point],
        isCluster: false,
      });
    }
  }

  return clusters;
}


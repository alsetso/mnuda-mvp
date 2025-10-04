/**
 * Map Performance Service
 * Provides optimizations for faster map loading and better strategic performance
 */

import { MAP_CONFIG } from '../config';

export class MapPerformanceService {
  private static instance: MapPerformanceService;
  private preloadedTiles: Set<string> = new Set();
  private isPreloading = false;

  static getInstance(): MapPerformanceService {
    if (!MapPerformanceService.instance) {
      MapPerformanceService.instance = new MapPerformanceService();
    }
    return MapPerformanceService.instance;
  }

  /**
   * Preload critical tiles for Minnesota region
   */
  async preloadMinnesotaTiles(mapInstance: import('mapbox-gl').Map): Promise<void> {
    if (this.isPreloading) return;
    this.isPreloading = true;

    try {
      // Preload tiles for strategic zoom levels (2-12) around Minnesota
      const minnesotaBounds = [
        [-97.5, 43.5], // Southwest corner
        [-89.5, 49.5]  // Northeast corner
      ];

      // Calculate tile coordinates for different zoom levels
      for (let zoom = MAP_CONFIG.DEFAULT_ZOOM; zoom <= MAP_CONFIG.MAX_ZOOM; zoom++) {
        const tiles = this.calculateTilesForBounds(minnesotaBounds, zoom);
        
        for (const tile of tiles) {
          const tileKey = `${tile.z}/${tile.x}/${tile.y}`;
          if (!this.preloadedTiles.has(tileKey)) {
            try {
              // Preload tile by requesting it
              await this.preloadTile(mapInstance, tile);
              this.preloadedTiles.add(tileKey);
            } catch (error) {
              console.warn(`Failed to preload tile ${tileKey}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error preloading Minnesota tiles:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Calculate tile coordinates for given bounds and zoom level
   */
  private calculateTilesForBounds(bounds: number[][], zoom: number): Array<{x: number, y: number, z: number}> {
    const tiles: Array<{x: number, y: number, z: number}> = [];
    
    const [sw, ne] = bounds;
    const [swLng, swLat] = sw;
    const [neLng, neLat] = ne;

    // Convert lat/lng to tile coordinates
    const swTile = this.lngLatToTile(swLng, swLat, zoom);
    const neTile = this.lngLatToTile(neLng, neLat, zoom);

    // Generate all tiles in the bounds
    for (let x = swTile.x; x <= neTile.x; x++) {
      for (let y = neTile.y; y <= swTile.y; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }

    return tiles;
  }

  /**
   * Convert longitude/latitude to tile coordinates
   */
  private lngLatToTile(lng: number, lat: number, zoom: number): {x: number, y: number} {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x, y };
  }

  /**
   * Preload a single tile
   */
  private async preloadTile(mapInstance: import('mapbox-gl').Map, tile: {x: number, y: number, z: number}): Promise<void> {
    return new Promise((resolve, reject) => {
      const source = mapInstance.getSource('mapbox') as { tiles?: string[] };
      if (source && source.tiles) {
        // Tile is already available
        resolve();
        return;
      }

      // Create a temporary request to preload the tile
      const tileUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/${tile.z}/${tile.x}/${tile.y}?access_token=${MAP_CONFIG.MAPBOX_TOKEN}`;
      
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load tile ${tile.z}/${tile.x}/${tile.y}`));
      img.src = tileUrl;
    });
  }

  /**
   * Optimize map rendering performance
   */
  optimizeMapRendering(mapInstance: import('mapbox-gl').Map): void {
    // Disable unnecessary layers for better performance
    const style = mapInstance.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer) => {
        // Optimize symbol layers
        if (layer.type === 'symbol') {
          mapInstance.setLayoutProperty(layer.id, 'text-allow-overlap', false);
          mapInstance.setLayoutProperty(layer.id, 'text-ignore-placement', false);
          mapInstance.setLayoutProperty(layer.id, 'icon-allow-overlap', false);
        }
        
        // Optimize raster layers
        if (layer.type === 'raster') {
          mapInstance.setPaintProperty(layer.id, 'raster-opacity', 0.9);
        }
      });
    }

    // Set performance-focused options
    mapInstance.setRenderWorldCopies(MAP_CONFIG.PERFORMANCE.RENDER_WORLD_COPIES);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    preloadedTiles: number;
    isPreloading: boolean;
  } {
    return {
      preloadedTiles: this.preloadedTiles.size,
      isPreloading: this.isPreloading,
    };
  }

  /**
   * Clear preloaded tiles cache
   */
  clearCache(): void {
    this.preloadedTiles.clear();
    this.isPreloading = false;
  }
}

export const mapPerformanceService = MapPerformanceService.getInstance();

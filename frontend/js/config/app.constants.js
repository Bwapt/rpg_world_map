/**
 * Shared frontend constants used across services, map logic, and UI components.
 */
const API_ROUTES = {
  world: "/world",
  maps: "/maps",
  events: "/events",
  poi: "/poi",
  area: "/area"
};

const ENTITY_TYPES = {
  poi: "poi",
  area: "area"
};

const COLLECTION_NAMES = {
  pois: "pois",
  areas: "areas"
};

const EVENT_TYPES = {
  poiCreated: "poi:created",
  poiUpdated: "poi:updated",
  poiDeleted: "poi:deleted",
  areaCreated: "area:created",
  areaUpdated: "area:updated",
  areaDeleted: "area:deleted"
};

const UI_TEXT = {
  emptyMapTitle: "Aucune map",
  loading: "Chargement",
  uploadInProgress: "En cours",
  maxMapImageSize: "25 Mo",
  mapImageTooLarge: "Image trop lourde. La taille maximale autorisée est de 25 Mo."
};

const LIMITS = {
  maxMapImageSizeBytes: 25 * 1024 * 1024
};

const MAP_DEFAULTS = {
  areaColor: "#3b82f6",
  syncIntervalMs: 60000,
  popupPanTop: 72,
  popupPanSide: 24,
  popupPanBottom: 24
};

export {
  API_ROUTES,
  COLLECTION_NAMES,
  ENTITY_TYPES,
  EVENT_TYPES,
  LIMITS,
  MAP_DEFAULTS,
  UI_TEXT
};

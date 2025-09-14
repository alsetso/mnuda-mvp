export interface Pin {
  id: string;
  user_id: string;
  name: string;
  lat: number;
  lng: number;
  full_address: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePinData {
  name: string;
  lat: number;
  lng: number;
  full_address: string;
}

export interface PinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pinData: CreatePinData) => Promise<void>;
  initialAddress: string;
  coordinates: [number, number]; // [lng, lat]
}

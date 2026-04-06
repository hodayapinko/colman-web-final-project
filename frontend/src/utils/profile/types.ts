export interface IProfileField {
  key: string;
  label: string;
  value: string;
  type?: "text" | "email";
  multiline?: boolean;
  minRows?: number;
  maxLength?: number;
  onChange: (value: string) => void;
}

export interface IFormData {
  username: string;
  bio: string;
  profilePicture: string;
  imageFile: File | null;
  imagePreviewUrl?: string;
}

export interface IComparableProfileData {
  username: string;
  bio: string;
  profilePicture: string;
}

export const INITIAL_FORM: IFormData = {
  username: "",
  bio: "",
  profilePicture: "",
  imageFile: null,
};

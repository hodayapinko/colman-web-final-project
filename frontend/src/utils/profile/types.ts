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
  profilePicture: string;
  imageFile: File | null;
  imagePreviewUrl?: string;
}

export interface IComparableProfileData {
  username: string;
  profilePicture: string;
}

export const INITIAL_FORM: IFormData = {
  username: "",
  profilePicture: "",
  imageFile: null,
};

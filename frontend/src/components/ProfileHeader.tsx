import React from "react";
import type { IProfileField } from "../utils/profile/types";
import ProfileForm from "./ProfileForm";
import ProfileSummary from "./ProfileSummary";

interface ProfileHeaderProps {
  isEditing: boolean;
  form: {
    fields: IProfileField[];
    avatarSrc: string | null;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSaveChanges: () => Promise<void>;
    saving: boolean;
    hasProfileChange: boolean;
    error: string;
  };
  avatarSrc: string | null;
  username: string;
  reviewCount: number;
  onEdit: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isEditing,
  form,
  avatarSrc,
  username,
  reviewCount,
  onEdit,
}) => {
  if (isEditing) {
    return (
      <ProfileForm
        fields={form.fields}
        avatarSrc={form.avatarSrc}
        handleImageChange={form.handleImageChange}
        handleSaveChanges={form.handleSaveChanges}
        saving={form.saving}
        hasProfileChange={form.hasProfileChange}
        error={form.error}
      />
    );
  }

  return (
    <ProfileSummary
      avatarSrc={avatarSrc}
      username={username}
      reviewCount={reviewCount}
      onEdit={onEdit}
    />
  );
};

export default ProfileHeader;

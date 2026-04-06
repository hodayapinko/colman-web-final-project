import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/userService";
import { type IFormData, type IComparableProfileData, INITIAL_FORM, type IProfileField } from "./types";

function getProfileComparableData(data: IFormData): IComparableProfileData {
  return {
    username: data.username,
    bio: data.bio,
    profilePicture: data.profilePicture ?? "",
  };
}

function getErrorMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function useProfileForm() {
  const { user, setUser } = useAuth();

  const [formData, setFormData] = useState<IFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const initialProfileRef = useRef<IComparableProfileData>(
    getProfileComparableData(INITIAL_FORM)
  );

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await userService.getById(user._id);

        const nextFormData: IFormData = {
          username: data.username ?? "",
          bio: data.bio ?? "",
          profilePicture: data.profilePicture ?? "",
          imageFile: null,
        };

        setFormData(nextFormData);
        initialProfileRef.current = getProfileComparableData(nextFormData);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load profile"));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const updateField =
    <K extends keyof Pick<IFormData, "username" | "bio">>(key: K) =>
    (value: IFormData[K]) => {
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      imageFile: file,
      imagePreviewUrl: URL.createObjectURL(file),
    }));
  };

  const getHasProfileChange = () => {
    if (formData.imageFile) return true;

    return (
      JSON.stringify(getProfileComparableData(formData)) !==
      JSON.stringify(initialProfileRef.current)
    );
  };

  const handleSaveChanges = async () => {
    if (!user || !getHasProfileChange()) return;

    try {
      setSaving(true);
      setError("");

      let profilePicture = formData.profilePicture;

      if (formData.imageFile) {
        profilePicture = await userService.uploadProfilePicture(formData.imageFile);
      }

      const updated = await userService.update(user._id, {
        username: formData.username,
        bio: formData.bio,
        profilePicture,
      });

      setUser((prev) =>
        prev
          ? {
              ...prev,
              ...updated,
            }
          : prev
      );

      const nextFormData: IFormData = {
        username: updated.username ?? "",
        bio: updated.bio ?? "",
        profilePicture: updated.profilePicture ?? "",
        imageFile: null,
      };

      setFormData(nextFormData);
      initialProfileRef.current = getProfileComparableData(nextFormData);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save profile"));
    } finally {
      setSaving(false);
    }
  };

  const fields: IProfileField[] = [
    {
      key: "username",
      label: "Username",
      value: formData.username,
      type: "text",
      onChange: updateField("username"),
    },
    {
      key: "bio",
      label: "Bio",
      value: formData.bio,
      type: "text",
      multiline: true,
      minRows: 3,
      maxLength: 500,
      onChange: updateField("bio"),
    },
  ];

  const avatarSrc = formData.imagePreviewUrl || formData.profilePicture || null;

  return {
    fields,
    avatarSrc,
    loading,
    saving,
    error,
    hasProfileChange: getHasProfileChange(),
    handleImageChange,
    handleSaveChanges,
  };
}
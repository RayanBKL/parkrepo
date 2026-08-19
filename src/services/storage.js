import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { generateVehicleId } from "./algorithm";

/**
 * Uploads an image file to Firebase Storage under a specific path
 * @param {File} file - The file object from input type="file"
 * @param {string} parkingId - ID of the parking
 * @param {string} folder - "proofs" or other
 * @param {Function} onProgress - Callback for upload progress (0 to 100)
 * @returns {Promise<string>} - The public download URL of the uploaded file
 */
export const uploadImage = async (file, parkingId, folder = "proofs", onProgress = null) => {
  if (!file) throw new Error("No file provided");

  const fileExt = file.name.split('.').pop();
  const uniqueName = `${generateVehicleId()}_${Date.now()}.${fileExt}`;
  const filePath = `parkings/${parkingId}/${folder}/${uniqueName}`;
  
  const storageRef = ref(storage, filePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

export interface IStorageDriver {
  /**
   * Initialize the driver (optional)
   */
  onModuleInit?(): Promise<void>;

  /**
   * Upload a file
   * @param buffer File content
   * @param objectKey Key to store the file under
   * @param mimeType MIME type of the file
   * @param size Size of the file in bytes
   * @returns Public URL of the uploaded file
   */
  uploadFile(
    buffer: Buffer,
    objectKey: string,
    mimeType: string,
    size: number,
  ): Promise<string>;

  /**
   * Delete a file
   * @param objectKey Key of the file to delete
   */
  deleteFile(objectKey: string): Promise<void>;

  /**
   * Get file content
   * @param objectKey Key of the file to retrieve
   */
  getFile(objectKey: string): Promise<Buffer>;

  /**
   * Get public URL for a file
   * @param objectKey Key of the file
   */
  getPublicUrl(objectKey: string): string;

  /**
   * Check if driver is properly configured
   */
  isConfigured(): boolean;
}

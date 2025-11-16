'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FiX, FiCheck, FiRotateCw, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { Area } from 'react-easy-crop';

interface AvatarCropModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: File) => void;
}

export default function AvatarCropModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation: number) => {
    setRotation(rotation);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180;
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Set canvas to transparent (not black)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If rotation is 0, simple crop
    if (rotation === 0) {
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
    } else {
      // Calculate rotated dimensions
      const { width: rotatedWidth, height: rotatedHeight } = rotateSize(
        image.width,
        image.height,
        rotation
      );

      // Create rotated canvas
      const rotatedCanvas = document.createElement('canvas');
      rotatedCanvas.width = rotatedWidth;
      rotatedCanvas.height = rotatedHeight;
      const rotatedCtx = rotatedCanvas.getContext('2d');

      if (!rotatedCtx) {
        throw new Error('No 2d context for rotated canvas');
      }

      // Draw rotated image
      rotatedCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
      rotatedCtx.rotate(getRadianAngle(rotation));
      rotatedCtx.translate(-image.width / 2, -image.height / 2);
      rotatedCtx.drawImage(image, 0, 0);

      // Crop from rotated canvas
      ctx.drawImage(
        rotatedCanvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            reject(new Error('Canvas is empty or invalid'));
          }
        },
        'image/png',
        0.95
      );
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );

      // Convert blob to File
      const file = new File([croppedImageBlob], 'avatar.png', {
        type: 'image/png',
      });

      onCropComplete(file);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-black text-gray-900">Tùy chỉnh avatar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="text-xl text-gray-600" />
          </button>
        </div>

        {/* Cropper */}
        <div className="relative flex-1 min-h-[400px] bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="round"
            showGrid={false}
          />
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-gray-200 space-y-4">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiZoomIn className="text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Phóng to</span>
              </div>
              <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B35]"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiRotateCw className="text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Xoay</span>
              </div>
              <span className="text-sm text-gray-500">{rotation}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B35]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <FiRotateCw />
              Đặt lại
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing || !croppedAreaPixels}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-xl font-bold hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <FiCheck />
                  <span>Lưu avatar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// Brand Kit page - Manage branding settings
// Upload logo, set colors, and configure font styles

'use client'; // This page uses client-side features

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Upload, Palette, Type, Save, X } from 'lucide-react';

/**
 * Brand Kit page component
 * Allows users to customize their brand identity
 */
export default function BrandKitPage() {
  const [isSaving, setIsSaving] = useState(false);

  // Set page title
  React.useEffect(() => {
    document.title = 'Brand Kit - Realestic';
  }, []);

  // Brand kit state (in a real app, this would be fetched from an API)
  const [brandKit, setBrandKit] = useState({
    logo_url: '',
    primary_color: '#0ea5e9',
    secondary_color: '#0369a1',
    accent_color: '#f59e0b',
    font_family: 'Inter',
    font_weight: 400,
  });

  /**
   * Handle logo upload
   */
  const handleLogoUpload = () => {
    // In a real app, this would open a file picker and upload the logo
    alert('Logo upload functionality would be implemented here');
  };

  /**
   * Handle logo removal
   */
  const handleLogoRemove = () => {
    setBrandKit({ ...brandKit, logo_url: '' });
  };

  /**
   * Save brand kit changes
   */
  const handleSave = async () => {
    setIsSaving(true);

    // Simulate save (in a real app, this would call the API)
    setTimeout(() => {
      setIsSaving(false);
      alert('Brand kit saved successfully!');
    }, 1000);
  };

  // Font options
  const fontOptions = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Raleway',
    'Playfair Display',
  ];

  // Font weight options
  const fontWeightOptions = [
    { value: 300, label: 'Light' },
    { value: 400, label: 'Regular' },
    { value: 500, label: 'Medium' },
    { value: 600, label: 'Semi Bold' },
    { value: 700, label: 'Bold' },
  ];

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <Header 
        title="Brand Kit" 
        subtitle="Customize your brand identity for consistent marketing"
      />

      {/* Page content */}
      <div className="p-4 sm:p-6 max-w-4xl text-white">
        <div className="space-y-6">
          {/* Save button at the top */}
          <div className="flex gap-3">
            <Button onClick={handleSave} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Save Brand Kit
            </Button>
          </div>

          {/* Logo section */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-white">Logo</h2>
            </div>

            <p className="text-gray-600 mb-4">
              Upload your logo to appear on all your property listings and marketing materials.
            </p>

            {brandKit.logo_url ? (
              /* Show uploaded logo */
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-white/10">
                  <img
                    src={brandKit.logo_url}
                    alt="Brand logo"
                    className="max-w-full max-h-full object-contain p-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleLogoUpload}>
                    Change Logo
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleLogoRemove}>
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              /* Logo upload area */
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  No logo uploaded yet
                </p>
                <Button onClick={handleLogoUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: PNG or SVG, max 2MB
                </p>
              </div>
            )}
          </Card>

          {/* Color scheme section */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-white">Color Scheme</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Choose colors that represent your brand. These will be used across all your marketing materials.
            </p>

            <div className="space-y-6">
              {/* Primary color */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={brandKit.primary_color}
                      onChange={(e) =>
                        setBrandKit({ ...brandKit, primary_color: e.target.value })
                      }
                      className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandKit.primary_color}
                      onChange={(e) =>
                        setBrandKit({ ...brandKit, primary_color: e.target.value })
                      }
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div
                  className="w-24 h-24 rounded-lg shadow-sm"
                  style={{ backgroundColor: brandKit.primary_color }}
                />
              </div>

              {/* Secondary color */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={brandKit.secondary_color}
                      onChange={(e) =>
                        setBrandKit({ ...brandKit, secondary_color: e.target.value })
                      }
                      className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandKit.secondary_color}
                      onChange={(e) =>
                        setBrandKit({ ...brandKit, secondary_color: e.target.value })
                      }
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div
                  className="w-24 h-24 rounded-lg shadow-sm"
                  style={{ backgroundColor: brandKit.secondary_color }}
                />
              </div>

              {/* Accent color */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={brandKit.accent_color}
                      onChange={(e) =>
                        setBrandKit({ ...brandKit, accent_color: e.target.value })
                      }
                      className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandKit.accent_color}
                      onChange={(e) =>
                        setBrandKit({ ...brandKit, accent_color: e.target.value })
                      }
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div
                  className="w-24 h-24 rounded-lg shadow-sm"
                  style={{ backgroundColor: brandKit.accent_color }}
                />
              </div>
            </div>

            {/* Color palette preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Color Palette Preview</p>
              <div className="flex gap-2">
                <div
                  className="flex-1 h-16 rounded"
                  style={{ backgroundColor: brandKit.primary_color }}
                />
                <div
                  className="flex-1 h-16 rounded"
                  style={{ backgroundColor: brandKit.secondary_color }}
                />
                <div
                  className="flex-1 h-16 rounded"
                  style={{ backgroundColor: brandKit.accent_color }}
                />
              </div>
            </div>
          </Card>

          {/* Typography section */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Type className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-white">Typography</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Choose a font style that represents your brand personality.
            </p>

            <div className="space-y-4">
              {/* Font family selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={brandKit.font_family}
                  onChange={(e) =>
                    setBrandKit({ ...brandKit, font_family: e.target.value })
                  }
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font weight selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Weight
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={brandKit.font_weight}
                  onChange={(e) =>
                    setBrandKit({ ...brandKit, font_weight: parseInt(e.target.value) })
                  }
                >
                  {fontWeightOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font preview */}
              <div className="mt-4 p-6 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-3">Font Preview</p>
                <p
                  className="text-3xl mb-2"
                  style={{
                    fontFamily: brandKit.font_family,
                    fontWeight: brandKit.font_weight,
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </p>
                <p
                  className="text-base text-gray-600"
                  style={{
                    fontFamily: brandKit.font_family,
                    fontWeight: brandKit.font_weight,
                  }}
                >
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
                </p>
              </div>
            </div>
          </Card>

          {/* Save button at the bottom */}
          <div className="flex gap-3">
            <Button onClick={handleSave} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Save Brand Kit
            </Button>
            <Button variant="outline">
              Reset to Default
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


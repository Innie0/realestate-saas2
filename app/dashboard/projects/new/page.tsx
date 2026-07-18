// New project page - Create a new property listing project
// Form to enter property details and start a new project
// Saves to Supabase database via API

'use client'; // This page uses client-side features

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Surface from '@/components/ui/Surface';
import { useToast } from '@/components/providers/ToastProvider';

/**
 * New project page component
 * Form to create a new property listing project
 */
export default function NewProjectPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Set page title
  React.useEffect(() => {
    document.title = 'New Project - Oikaro';
  }, []);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('house');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [price, setPrice] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [features, setFeatures] = useState('');

  /**
   * Handle form submission
   * Creates a new project and saves it to Supabase database via API
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!title) {
      toast.error('Please enter a project title');
      return;
    }

    setIsLoading(true);

    try {
      // Create project object
      const projectData = {
        title,
        description,
        property_type: propertyType,
        property_info: {
          address,
          city,
          state,
          zip_code: zipCode,
          bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
          bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
          square_feet: squareFeet ? parseInt(squareFeet) : undefined,
          price: price ? parseInt(price) : undefined,
          year_built: yearBuilt ? parseInt(yearBuilt) : undefined,
          lot_size: lotSize ? parseFloat(lotSize) : undefined,
          features: features ? features.split('\n').map(f => f.trim()).filter(f => f) : [],
        },
      };

      // Save to database via API
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }

      // Success message
      toast.success('Project created successfully!');

      // Redirect to project detail page with the real project ID from database
      router.push(`/dashboard/projects/${result.data.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <DashboardPage
      title="New project"
      subtitle="Start a new property listing project"
      size="medium"
      actions={
        <Button type="submit" form="new-project-form" isLoading={isLoading} size="sm">
          Create project
        </Button>
      }
    >
        <form id="new-project-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Basic information */}
          <Surface padding="md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic information</h2>
            
            <div className="space-y-4">
              <Input
                label="Project Title"
                type="text"
                placeholder="e.g., 123 Main Street Listing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                helperText="Give your project a memorable name"
              />

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
                  rows={6}
                  placeholder="Detailed description of the property... (This will be used by AI to generate marketing content)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-700">
                  💡 Tip: The more detailed your description, the better the AI-generated content will be!
                </p>
              </div>

              <Select
                label="Property Type"
                value={propertyType}
                onChange={setPropertyType}
                required
                options={[
                  { value: 'house', label: 'House' },
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'condo', label: 'Condo' },
                  { value: 'land', label: 'Land' },
                  { value: 'commercial', label: 'Commercial' },
                ]}
              />
            </div>
          </Surface>

          {/* Property address */}
          <Surface padding="md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property address</h2>
            
            <div className="space-y-4">
              <Input
                label="Street Address"
                type="text"
                placeholder="123 Main Street"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="City"
                  type="text"
                  placeholder="San Francisco"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />

                <Input
                  label="State"
                  type="text"
                  placeholder="CA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />

                <Input
                  label="ZIP Code"
                  type="text"
                  placeholder="94102"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>
          </Surface>

          {/* Property details */}
          <Surface padding="md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Bedrooms"
                type="number"
                placeholder="3"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              />

              <Input
                label="Bathrooms"
                type="number"
                placeholder="2"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
              />

              <Input
                label="Square Feet"
                type="number"
                placeholder="2000"
                value={squareFeet}
                onChange={(e) => setSquareFeet(e.target.value)}
              />

              <Input
                label="Price ($)"
                type="number"
                placeholder="500000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

              <Input
                label="Year Built"
                type="number"
                placeholder="2020"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
              />

              <Input
                label="Lot Size (acres)"
                type="number"
                step="0.01"
                placeholder="0.5"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Special Features
              </label>
              <textarea
                className="block w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
                rows={7}
                placeholder="Enter each feature on a new line:
• Infinity pool with lake views
• Wolf stove and SubZero refrigerator
• Custom Italian marble flooring
• 24/7 guard-gated community
• Boat dock included with property"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-700">
                💡 Enter each feature on a new line. Be specific and descriptive!
              </p>
            </div>
          </Surface>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
    </DashboardPage>
  );
}


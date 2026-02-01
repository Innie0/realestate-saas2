// Project detail page - View and edit a specific project
// Upload photos, enter property info, generate AI content
// Features: Multiple tone versions, Zillow preview, copy to MLS, AI refinement

'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { 
  Upload, Sparkles, Save, Trash2, Image as ImageIcon, Calendar, FileText, 
  Building2, Copy, Check, Edit3, Wand2, Eye, ChevronLeft, ChevronRight,
  Home, MapPin, Bed, Bath, Square, DollarSign, ExternalLink, X
} from 'lucide-react';
import { Project, AIGeneratedContent } from '@/types';

// Tone types for description variations
type DescriptionTone = 'professional' | 'casual' | 'luxury';

interface ToneVersion {
  tone: DescriptionTone;
  label: string;
  description: string;
  content: string;
  instagram?: string;
  facebook?: string;
}

/**
 * Project detail page component
 * View and edit project details, upload images, generate AI content
 */
export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise (Next.js 16 requirement)
  const { id: projectId } = use(params);
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Project data state
  const [project, setProject] = useState<Project | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [relatedTasks, setRelatedTasks] = useState<any[]>([]);
  const [relatedTransactions, setRelatedTransactions] = useState<any[]>([]);

  // Description tone versions
  const [selectedTone, setSelectedTone] = useState<DescriptionTone>('professional');
  const [toneVersions, setToneVersions] = useState<ToneVersion[]>([]);

  // Copy to clipboard states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // AI Refinement modal
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [refineInstructions, setRefineInstructions] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Preview modal for Zillow-style view
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  // Generation results modal
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [generationResults, setGenerationResults] = useState<ToneVersion[]>([]);
  const [selectedGenerationTone, setSelectedGenerationTone] = useState<DescriptionTone>('professional');

  // Manual edit states
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  // Load project data from API on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        
        // Fetch from the actual API
        const response = await fetch(`/api/projects/${projectId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          // Transform data to match expected format
          const projectData = {
            ...result.data,
            images: result.data.images || [],
            property_info: result.data.property_info || {},
            ai_content: result.data.ai_content || null,
          };
          setProject(projectData);
          
          // If there's existing AI content, set up tone versions
          if (projectData.ai_content?.description) {
            // Check if we have saved tone versions
            if (projectData.ai_content.tone_versions) {
              const savedVersions: ToneVersion[] = [];
              
              if (projectData.ai_content.tone_versions.professional) {
                savedVersions.push({
                  tone: 'professional',
                  label: 'Professional',
                  description: 'Formal, business-appropriate tone',
                  content: projectData.ai_content.tone_versions.professional.description,
                  instagram: projectData.ai_content.tone_versions.professional.instagram,
                  facebook: projectData.ai_content.tone_versions.professional.facebook,
                });
              }
              
              if (projectData.ai_content.tone_versions.casual) {
                savedVersions.push({
                  tone: 'casual',
                  label: 'Casual',
                  description: 'Friendly, conversational tone',
                  content: projectData.ai_content.tone_versions.casual.description,
                  instagram: projectData.ai_content.tone_versions.casual.instagram,
                  facebook: projectData.ai_content.tone_versions.casual.facebook,
                });
              }
              
              if (projectData.ai_content.tone_versions.luxury) {
                savedVersions.push({
                  tone: 'luxury',
                  label: 'Luxury',
                  description: 'Upscale, high-end tone',
                  content: projectData.ai_content.tone_versions.luxury.description,
                  instagram: projectData.ai_content.tone_versions.luxury.instagram,
                  facebook: projectData.ai_content.tone_versions.luxury.facebook,
                });
              }
              
              setToneVersions(savedVersions);
              
              // Set the selected tone (default to saved preference or professional)
              const savedTone = projectData.ai_content.selected_tone || 'professional';
              setSelectedTone(savedTone);
              setEditedDescription(projectData.ai_content.description);
            } else {
              // Legacy: only professional version exists
              setToneVersions([{
                tone: 'professional',
                label: 'Professional',
                description: 'Formal, business-appropriate tone',
                content: projectData.ai_content.description,
                instagram: projectData.ai_content.instagram,
                facebook: projectData.ai_content.facebook,
              }]);
              setEditedDescription(projectData.ai_content.description);
            }
          }
        } else {
          console.error('Failed to load project:', result.error);
          setProject(null);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  // Fetch related tasks and transactions
  useEffect(() => {
    const fetchRelatedData = async () => {
      if (!project) return;
      
      try {
        const tasksRes = await fetch(`/api/calendar/events?project_id=${projectId}`);
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setRelatedTasks(tasksData.events || []);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }

      try {
        const transactionsRes = await fetch(`/api/transactions?project_id=${projectId}`);
        if (transactionsRes.ok) {
          const transData = await transactionsRes.json();
          setRelatedTransactions(transData.data || []);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchRelatedData();
  }, [projectId, project]);

  /**
   * Auto-save functionality - debounced save after changes
   */
  useEffect(() => {
    // Don't auto-save if still loading initial data or if no changes
    if (isLoading || !project || !hasUnsavedChanges) return;

    // Mark as saving after a delay
    const saveTimer = setTimeout(async () => {
      setAutoSaveStatus('saving');
      
      try {
        // Only send essential data (exclude images to reduce payload size)
        const payload = {
          id: project.id,
          title: project.title,
          description: project.description,
          status: project.status,
          property_type: project.property_type,
          property_info: project.property_info,
          ai_content: project.ai_content ? {
            ...project.ai_content,
            description: editedDescription,
          } : null,
          updated_at: new Date().toISOString(),
        };

        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        // Check if response is JSON or HTML error page
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();

          if (result.success) {
            setAutoSaveStatus('saved');
            setHasUnsavedChanges(false);
            // Reset to idle after showing "saved" for 1.5 seconds
            setTimeout(() => setAutoSaveStatus('idle'), 1500);
          } else {
            throw new Error(result.error || 'Save failed');
          }
        } else {
          // Received HTML error page (like Cloudflare error)
          const errorText = await response.text();
          console.error('Auto-save failed with non-JSON response:', response.status, response.statusText);
          console.error('Response preview:', errorText.substring(0, 500));
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      } catch (error: any) {
        console.error('Auto-save error:', error);
        console.error('Error details:', {
          message: error.message,
          projectId: project?.id,
          payloadSize: JSON.stringify(project?.ai_content || {}).length
        });
        setAutoSaveStatus('error');
        // Reset to idle after showing error for 3 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    }, 500); // Auto-save after 0.5 seconds of no changes (nearly instant)

    return () => clearTimeout(saveTimer);
  }, [project, hasUnsavedChanges, isLoading, editedDescription]);

  /**
   * Handle image upload
   * Converts images to optimized base64 with compression
   */
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      
      if (!files || files.length === 0) return;

      setIsUploading(true);

      try {
        const uploadedImageUrls: string[] = [];
        
        // Process each image
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} is too large. Maximum file size is 5MB.`);
            continue;
          }

          // Compress and convert to base64
          const compressedUrl = await compressImage(file);
          uploadedImageUrls.push(compressedUrl);
        }

        // Update project with new image URLs and save to database immediately
        const updatedImages = [...(project?.images || []), ...uploadedImageUrls];
        
        // Save directly to database
        const response = await fetch(`/api/projects/${project!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: updatedImages,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Update local state with saved data
          setProject(prev => prev ? {
            ...prev,
            images: updatedImages,
          } : null);

          alert(`${uploadedImageUrls.length} image(s) uploaded successfully!`);
        } else {
          throw new Error(result.error || 'Failed to save images');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload images. Please try again.');
      } finally {
        setIsUploading(false);
      }
    };
    
    input.click();
  };

  /**
   * Compress image to reduce size before storing
   */
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if too large (max 1200px width)
          const maxWidth = 1200;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx!.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression (0.7 quality for JPEG)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Handle image deletion
   * Deletes image from database immediately
   */
  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const updatedImages = project!.images.filter(img => img !== imageUrl);
      
      // Save directly to database
      const response = await fetch(`/api/projects/${project!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: updatedImages,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProject(prev => prev ? {
          ...prev,
          images: updatedImages,
        } : null);
      } else {
        throw new Error(result.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Delete image error:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  /**
   * Delete a key feature from the list
   */
  const handleDeleteKeyFeature = (index: number) => {
    setProject(prev => {
      if (!prev || !prev.ai_content?.key_features) return prev;
      
      const updatedFeatures = prev.ai_content.key_features.filter((_, idx) => idx !== index);
      
      return {
        ...prev,
        ai_content: {
          ...prev.ai_content,
          key_features: updatedFeatures
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  /**
   * Generate AI content with multiple tone versions
   */
  const handleGenerateAI = async () => {
    if (!project) return;

    setIsGenerating(true);

    try {
      const propertyInfo = project.property_info || {};
      const images = project.images || [];
      
      // Normalize images to URL strings (handle both string URLs and object format)
      const imageUrls = images.map(img => typeof img === 'string' ? img : img.url);

      // Step 1: Analyze images if available (using real OpenAI Vision API)
      let imageAnalysis: any = null;
      if (imageUrls.length > 0) {
        try {
          const response = await fetch('/api/ai/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: imageUrls.slice(0, 10) }), // Limit to 10 images
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              imageAnalysis = result.data;
              console.log('Image analysis complete:', imageAnalysis);
            }
          }
        } catch (error) {
          console.warn('Image analysis failed, continuing without it:', error);
        }
      }

      // Step 2: Generate all three tone versions using OpenAI
      const versions: ToneVersion[] = [];
      
      for (const tone of ['professional', 'casual', 'luxury'] as DescriptionTone[]) {
        try {
          const response = await fetch('/api/ai/generate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              propertyInfo: {
                ...propertyInfo,
                propertyType: project.property_type,
              },
              imageAnalysis,
              tone,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              const labels = {
                professional: 'Professional',
                casual: 'Casual & Friendly',
                luxury: 'Luxury & Prestigious',
              };
              const descriptions = {
                professional: 'Formal, business-appropriate tone ideal for MLS listings',
                casual: 'Warm, approachable tone perfect for social media',
                luxury: 'Elegant, sophisticated tone for high-end properties',
              };

              // Generate social media posts for this tone
              const socialPosts = await generateSocialPostsForTone(project, propertyInfo, imageUrls.length, tone);
              
              versions.push({
                tone,
                label: labels[tone],
                description: descriptions[tone],
                content: result.data.description,
                instagram: socialPosts.instagram,
                facebook: socialPosts.facebook,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to generate ${tone} version:`, error);
          // Fallback to template if API fails
          const socialPosts = await generateSocialPostsForTone(project, propertyInfo, images.length, tone);
          
          versions.push({
            tone,
            label: tone === 'professional' ? 'Professional' : tone === 'casual' ? 'Casual & Friendly' : 'Luxury & Prestigious',
            description: tone === 'professional' ? 'Formal, business-appropriate tone ideal for MLS listings' : 
                        tone === 'casual' ? 'Warm, approachable tone perfect for social media' :
                        'Elegant, sophisticated tone for high-end properties',
            content: generateDescription(tone, project, propertyInfo, imageAnalysis),
            instagram: socialPosts.instagram,
            facebook: socialPosts.facebook,
          });
        }
      }

      // Step 3: Generate headline and key features
      const headline = await generateHeadlineWithAI(project, propertyInfo, imageAnalysis);
      const keyFeatures = await extractKeyFeaturesWithAI(project, propertyInfo, imageAnalysis);

      // Store results and show modal
      setGenerationResults(versions);
      setSelectedGenerationTone('professional');
      setShowGenerationModal(true);

      // Also update state for backward compatibility
      setToneVersions(versions);
      setEditedDescription(versions[0]?.content || '');

      // Save all three tone versions to the database
      const toneVersionsData = {
        professional: versions.find(v => v.tone === 'professional') ? {
          description: versions.find(v => v.tone === 'professional')!.content,
          instagram: versions.find(v => v.tone === 'professional')!.instagram || '',
          facebook: versions.find(v => v.tone === 'professional')!.facebook || '',
        } : undefined,
        casual: versions.find(v => v.tone === 'casual') ? {
          description: versions.find(v => v.tone === 'casual')!.content,
          instagram: versions.find(v => v.tone === 'casual')!.instagram || '',
          facebook: versions.find(v => v.tone === 'casual')!.facebook || '',
        } : undefined,
        luxury: versions.find(v => v.tone === 'luxury') ? {
          description: versions.find(v => v.tone === 'luxury')!.content,
          instagram: versions.find(v => v.tone === 'luxury')!.instagram || '',
          facebook: versions.find(v => v.tone === 'luxury')!.facebook || '',
        } : undefined,
      };

      setProject(prev => prev ? {
        ...prev,
        ai_content: {
          headline,
          description: versions[0]?.content || '',
          key_features: keyFeatures,
          instagram: versions[0]?.instagram || '',
          facebook: versions[0]?.facebook || '',
          generated_at: new Date().toISOString(),
          selected_tone: 'professional',
          tone_versions: toneVersionsData,
        },
      } : null);
      setHasUnsavedChanges(true);

    } catch (error) {
      console.error('AI generation error:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate description based on tone and image analysis
   */
  const generateDescription = (tone: DescriptionTone, proj: Project, info: any, imageAnalysis?: any): string => {
    const beds = info.bedrooms || 0;
    const baths = info.bathrooms || 0;
    const sqft = info.square_feet || 0;
    const price = info.price || 0;
    const city = info.city || 'a desirable location';
    const address = info.address || proj.title;
    const propertyType = proj.property_type || 'property';

    // Extract specific features from image analysis
    const getImageFeatures = (roomType: string) => {
      if (!imageAnalysis?.byRoomType?.[roomType]) return [];
      return imageAnalysis.byRoomType[roomType]
        .flatMap((img: any) => img.features || [])
        .filter((f: string) => f);
    };

    const kitchenFeatures = getImageFeatures('kitchen');
    const outdoorFeatures = getImageFeatures('outdoor') || getImageFeatures('exterior');
    const livingFeatures = getImageFeatures('living room') || getImageFeatures('living_room');
    const bathroomFeatures = getImageFeatures('bathroom');

    // Build 2-3 paragraph description matching the example style
    let paragraphs = [];
    
    if (tone === 'professional' || tone === 'luxury') {
      // PARAGRAPH 1: Opening + Interior + Kitchen
      let para1 = `This magnificent ${beds}-bedroom, ${baths}-bathroom ${propertyType} has been masterfully crafted for absolute comfort and sophistication. `;
      
      if (livingFeatures.length > 0) {
        para1 += `The home captivates with ${livingFeatures.slice(0, 3).join(', ')}, creating an environment of refined elegance. `;
      } else {
        para1 += `The residence features thoughtfully designed interiors with quality finishes that complement the elegant visual throughout. `;
      }
      para1 += `Custom details and ample windows provide access to abundant natural light, while premium materials curate a sophisticated living experience. `;
      
      if (kitchenFeatures.length > 0) {
        para1 += `The state of the art kitchen features ${kitchenFeatures.slice(0, 3).join(', ')}, offering the utmost in culinary convenience and style.`;
      } else {
        para1 += `The gourmet kitchen showcases professional-grade appliances and stunning finishes, perfect for both everyday living and elegant entertaining.`;
      }
      
      paragraphs.push(para1);
      
      // PARAGRAPH 2: Bedrooms + Outdoor
      let para2 = '';
      if (bathroomFeatures.length > 0) {
        para2 = `Upstairs, the primary suite evokes pure tranquility with ${bathroomFeatures.slice(0, 2).join(' and ')}, creating a spa-like retreat. `;
      } else {
        para2 = `The primary bedroom suite evokes pure tranquility with its spacious layout, substantial walk-in closet, and luxurious en-suite bathroom. `;
      }
      
      if (outdoorFeatures.length > 0) {
        para2 += `Outside, the resort-inspired grounds feature ${outdoorFeatures.slice(0, 2).join(', ')}, perfect for entertaining and relaxation.`;
      } else {
        para2 += `The private outdoor spaces offer a serene setting with lush landscaping and thoughtful amenities, ideal for both intimate gatherings and grand celebrations.`;
      }
      
      paragraphs.push(para2);
      
      // PARAGRAPH 3: Closing
      let para3 = tone === 'luxury' 
        ? `Drenched in the finest materials and appointments, this is a beyond spectacular opportunity in an exclusive neighborhood.`
        : `This exceptional property represents an outstanding opportunity for discerning buyers seeking quality, craftsmanship, and refined living.`;
      
      paragraphs.push(para3);
        
    } else {
      // PARAGRAPH 1: Opening + Interior + Kitchen
      let para1 = `Welcome to this amazing ${beds}-bed, ${baths}-bath home that's been thoughtfully designed for modern living! `;
      
      if (livingFeatures.length > 0) {
        para1 += `From the moment you step inside, you'll notice ${livingFeatures.slice(0, 2).join(' and ')}, making this space perfect for both everyday life and entertaining. `;
      } else {
        para1 += `The open layout creates a warm and inviting atmosphere that's perfect for making memories with family and friends. `;
      }
      
      if (kitchenFeatures.length > 0) {
        para1 += `The kitchen features ${kitchenFeatures.slice(0, 2).join(' and ')}, giving you everything needed for quick breakfasts or holiday feasts.`;
      } else {
        para1 += `The well-equipped kitchen has plenty of counter space and modern appliances, whether you're a gourmet chef or prefer takeout!`;
      }
      
      paragraphs.push(para1);
      
      // PARAGRAPH 2: Bedrooms + Outdoor
      let para2 = `The bedrooms provide peaceful retreats with generous closet space, and the primary suite offers a true escape at the end of the day. `;
      
      if (outdoorFeatures.length > 0) {
        para2 += `Outside, you'll find ${outdoorFeatures.slice(0, 2).join(' and ')}, perfect for summer BBQs, morning coffee, or just relaxing.`;
      } else {
        para2 += `The outdoor space gives you room to entertain, garden, or simply unwind in your own private oasis.`;
      }
      
      paragraphs.push(para2);
      
      // PARAGRAPH 3: Closing
      let para3 = `Honestly, homes like this don't come around often – it's the complete package you've been searching for!`;
      
      paragraphs.push(para3);
    }
    
    return paragraphs.join('\n');
  };

  /**
   * Generate headline using OpenAI
   */
  const generateHeadlineWithAI = async (proj: Project, info: any, imageAnalysis?: any): Promise<string> => {
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyInfo: { ...info, propertyType: proj.property_type },
          imageAnalysis,
          tone: 'headline',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.description) {
          // Extract first line as headline
          return result.data.description.split('\n')[0].trim();
        }
      }
    } catch (error) {
      console.error('Failed to generate headline with AI:', error);
    }
    
    // Fallback to template
    return generateHeadline(proj, info);
  };

  /**
   * Generate headline (fallback template)
   */
  const generateHeadline = (proj: Project, info: any): string => {
    const propertyType = {
      house: 'Home',
      condo: 'Condo',
      apartment: 'Apartment',
      land: 'Land',
      commercial: 'Commercial Property'
    }[proj.property_type || 'house'] || 'Property';
    
    if (info.square_feet && info.square_feet > 3000) {
      return `Expansive ${info.square_feet.toLocaleString()} Sq Ft ${propertyType} in ${info.city || 'Prime Location'}`;
    }
    
    if (info.city) {
      return `Stunning ${info.bedrooms || ''}BR ${propertyType} in ${info.city}`;
    }
    
    return `Exceptional ${info.bedrooms || ''}BR ${propertyType} - Must See!`;
  };

  /**
   * Extract key features using OpenAI
   */
  const extractKeyFeaturesWithAI = async (proj: Project, info: any, imageAnalysis?: any): Promise<string[]> => {
    // For now, use template-based with image analysis enhancement
    const features: string[] = [];
    
    if (info.bedrooms) features.push(`${info.bedrooms} Spacious Bedrooms`);
    if (info.bathrooms) features.push(`${info.bathrooms} Luxurious Bathrooms`);
    if (info.square_feet) features.push(`${info.square_feet.toLocaleString()} Square Feet`);
    if (info.year_built) features.push(`Built in ${info.year_built}`);
    if (info.lot_size) features.push(`${info.lot_size} Lot Size`);
    
    // Add features from image analysis
    if (imageAnalysis?.byRoomType) {
      Object.entries(imageAnalysis.byRoomType).forEach(([roomType, analyses]: [string, any]) => {
        analyses.forEach((analysis: any) => {
          if (analysis.sellingPoints && Array.isArray(analysis.sellingPoints)) {
            analysis.sellingPoints.forEach((point: string) => {
              if (!features.includes(point)) {
                features.push(point);
              }
            });
          }
        });
      });
    }
    
    if (info.features && Array.isArray(info.features)) {
      features.push(...info.features);
    }
    
    return features;
  };

  /**
   * Extract key features (fallback)
   */
  const extractKeyFeatures = (proj: Project, info: any): string[] => {
    const features: string[] = [];
    
    if (info.bedrooms) features.push(`${info.bedrooms} Spacious Bedrooms`);
    if (info.bathrooms) features.push(`${info.bathrooms} Luxurious Bathrooms`);
    if (info.square_feet) features.push(`${info.square_feet.toLocaleString()} Square Feet`);
    if (info.year_built) features.push(`Built in ${info.year_built}`);
    if (info.lot_size) features.push(`${info.lot_size} Lot Size`);
    if (info.features && Array.isArray(info.features)) {
      features.push(...info.features);
    }
    
    return features;
  };

  /**
   * Generate social media posts for a specific tone
   */
  const generateSocialPostsForTone = async (proj: Project, info: any, imageCount: number, tone: DescriptionTone) => {
    return generateSocialPosts(proj, info, imageCount, tone);
  };

  /**
   * Generate social media posts using OpenAI
   */
  const generateSocialPostsWithAI = async (proj: Project, info: any, imageCount: number, imageAnalysis?: any) => {
    // Use template-based generation for social posts (fast and reliable)
    return generateSocialPosts(proj, info, imageCount, 'professional');
  };

  /**
   * Generate social media posts (template)
   */
  const generateSocialPosts = (proj: Project, info: any, imageCount: number, tone?: DescriptionTone) => {
    const selectedTone = tone || 'professional';
    
    // Different styles based on tone
    if (selectedTone === 'luxury') {
      return generateLuxurySocialPosts(proj, info, imageCount);
    } else if (selectedTone === 'casual') {
      return generateCasualSocialPosts(proj, info, imageCount);
    } else {
      return generateProfessionalSocialPosts(proj, info, imageCount);
    }
  };

  /**
   * Professional social posts
   */
  const generateProfessionalSocialPosts = (proj: Project, info: any, imageCount: number) => {
    const propertyType = proj.property_type || 'home';
    
    let instagram = `✨ JUST LISTED ✨\n\n`;
    instagram += `Exceptional ${info.bedrooms}-bedroom, ${info.bathrooms}-bathroom ${propertyType} now available. `;
    instagram += `This meticulously maintained property showcases quality finishes and thoughtful design throughout.\n\n`;
    if (imageCount > 0) {
      instagram += `📸 View all ${imageCount} professional photos\n`;
    }
    instagram += `\n📧 Contact for details | 📅 Schedule your private showing\n\n`;
    instagram += `#JustListed #RealEstate #NewListing #PropertyForSale #HomeForSale`;
    
    let facebook = `🏡 NEW LISTING\n\n`;
    facebook += `Professional representation for this exceptional ${info.bedrooms}-bedroom, ${info.bathrooms}-bathroom ${propertyType}.\n\n`;
    facebook += `KEY FEATURES:\n`;
    facebook += `• ${info.bedrooms} Bedrooms\n`;
    facebook += `• ${info.bathrooms} Bathrooms\n`;
    facebook += `• Quality finishes throughout\n`;
    facebook += `• Move-in ready\n\n`;
    facebook += `This well-maintained property offers an excellent opportunity for discerning buyers.\n\n`;
    facebook += `📞 Contact us to schedule your private showing.`;
    
    return { instagram, facebook };
  };

  /**
   * Casual social posts
   */
  const generateCasualSocialPosts = (proj: Project, info: any, imageCount: number) => {
    const propertyType = proj.property_type || 'home';
    
    let instagram = `🏡 NEW LISTING ALERT! 🏡\n\n`;
    instagram += `This amazing ${info.bedrooms}-bed, ${info.bathrooms}-bath ${propertyType} just hit the market and it's a must-see! ✨\n\n`;
    instagram += `From the gorgeous finishes to the thoughtful layout, this place has it all. Perfect for making memories! 💫\n\n`;
    if (imageCount > 0) {
      instagram += `📸 Swipe through all ${imageCount} photos - every room is stunning!\n\n`;
    }
    instagram += `💬 DM me for the full scoop | 📅 Let's schedule a tour!\n\n`;
    instagram += `#NewHome #JustListed #DreamHome #RealEstate #HomeSweetHome #HouseHunting`;
    
    let facebook = `🎉 JUST LISTED! 🎉\n\n`;
    facebook += `You guys! I'm SO excited to share this incredible ${info.bedrooms}-bed, ${info.bathrooms}-bath ${propertyType} with you!\n\n`;
    facebook += `This place is seriously special - from the minute you walk in, you'll feel at home. Beautiful finishes, great layout, and SO much natural light!\n\n`;
    facebook += `QUICK DETAILS:\n`;
    facebook += `🛏️ ${info.bedrooms} bedrooms\n`;
    facebook += `🛁 ${info.bathrooms} bathrooms\n`;
    facebook += `✨ Move-in ready!\n\n`;
    if (imageCount > 0) {
      facebook += `Check out all ${imageCount} photos - you're going to LOVE it! `;
    }
    facebook += `Properties like this don't last long!\n\n`;
    facebook += `📱 Call or message me to set up a showing. Can't wait to show you around! 😊`;
    
    return { instagram, facebook };
  };

  /**
   * Luxury social posts
   */
  const generateLuxurySocialPosts = (proj: Project, info: any, imageCount: number) => {
    const propertyType = proj.property_type === 'house' ? 'residence' : proj.property_type || 'property';
    
    let instagram = `✨ EXCLUSIVE NEW LISTING ✨\n\n`;
    instagram += `A magnificent ${info.bedrooms}-bedroom, ${info.bathrooms}-bathroom ${propertyType} of extraordinary distinction.\n\n`;
    instagram += `Masterfully crafted with the finest materials and impeccable attention to detail. This rare offering represents the pinnacle of refined living.\n\n`;
    if (imageCount > 0) {
      instagram += `📸 ${imageCount} images showcase the exceptional craftsmanship\n\n`;
    }
    instagram += `Private showings available by appointment.\n\n`;
    instagram += `#LuxuryRealEstate #LuxuryHomes #ExclusiveProperty #PrestigeProperty #HighEndRealEstate`;
    
    let facebook = `DISTINGUISHED NEW OFFERING\n\n`;
    facebook += `We are privileged to present this exceptional ${info.bedrooms}-bedroom, ${info.bathrooms}-bathroom ${propertyType} of unparalleled distinction.\n\n`;
    facebook += `DISTINGUISHED FEATURES:\n`;
    facebook += `• ${info.bedrooms} luxurious bedrooms\n`;
    facebook += `• ${info.bathrooms} spa-inspired bathrooms\n`;
    facebook += `• Finest materials and craftsmanship throughout\n`;
    facebook += `• Impeccable attention to every detail\n\n`;
    facebook += `This rare offering has been masterfully crafted for those who accept nothing less than perfection. Every element reflects exceptional quality and sophisticated design.\n\n`;
    if (imageCount > 0) {
      facebook += `${imageCount} professional images available for your review. `;
    }
    facebook += `\n\nPrivate showings arranged exclusively for qualified clientele. Please contact us to arrange your personal tour of this extraordinary ${propertyType}.`;
    
    return { instagram, facebook };
  };

  /**
   * Apply selected tone from generation modal
   */
  const handleApplySelectedTone = () => {
    const selectedVersion = generationResults.find(v => v.tone === selectedGenerationTone);
    if (!selectedVersion) return;

    // Update the project with selected tone
    setSelectedTone(selectedGenerationTone);
    setEditedDescription(selectedVersion.content);
    
    setProject(prev => prev ? {
      ...prev,
      ai_content: prev.ai_content ? {
        ...prev.ai_content,
        description: selectedVersion.content,
        instagram: selectedVersion.instagram || '',
        facebook: selectedVersion.facebook || '',
        selected_tone: selectedGenerationTone,
      } : undefined,
    } : null);
    setHasUnsavedChanges(true);

    // Close modal
    setShowGenerationModal(false);
  };

  /**
   * Handle AI refinement
   */
  const handleRefineWithAI = async () => {
    if (!refineInstructions.trim() || !project) return;

    setIsRefining(true);

    try {
      // Call OpenAI API to refine the description based on user instructions
      const response = await fetch('/api/ai/refine-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDescription: editedDescription,
          instructions: refineInstructions,
          propertyInfo: project.property_info,
          tone: selectedTone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine content');
      }

      const result = await response.json();

      if (result.success && result.refinedDescription) {
        const refinedContent = result.refinedDescription;
        setEditedDescription(refinedContent);
        
        // Update the current tone version
        setToneVersions(prev => prev.map(v => 
          v.tone === selectedTone ? { ...v, content: refinedContent } : v
        ));

        // Update project AI content
        setProject(prev => prev ? {
          ...prev,
          ai_content: prev.ai_content ? {
            ...prev.ai_content,
            description: refinedContent,
          } : undefined,
        } : null);
        setHasUnsavedChanges(true);

        setShowRefineModal(false);
        setRefineInstructions('');
      } else {
        throw new Error(result.error || 'Refinement failed');
      }
    } catch (error) {
      console.error('Refinement error:', error);
      alert('Failed to refine content. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  /**
   * Apply refinement based on instructions
   */
  const applyRefinement = (content: string, instructions: string): string => {
    const lower = instructions.toLowerCase();
    
    // Simulate AI refinement based on common instructions
    if (lower.includes('shorter') || lower.includes('concise')) {
      return content.split('\n\n').slice(0, 3).join('\n\n');
    }
    if (lower.includes('longer') || lower.includes('more detail')) {
      return content + `\n\nAdditional highlights include premium finishes throughout, modern amenities, and a location that offers both convenience and tranquility. This property has been meticulously maintained and is move-in ready.`;
    }
    if (lower.includes('emphasize') || lower.includes('highlight')) {
      const emphasis = instructions.replace(/emphasize|highlight|focus on/gi, '').trim();
      return content.replace(/\./g, `. The ${emphasis} is particularly noteworthy.`).replace(/particularly noteworthy\. particularly/g, 'particularly');
    }
    if (lower.includes('remove') || lower.includes('delete')) {
      const toRemove = instructions.replace(/remove|delete|take out/gi, '').trim();
      return content.split('\n').filter(line => !line.toLowerCase().includes(toRemove.toLowerCase())).join('\n');
    }
    
    return content + `\n\n[Refined based on: ${instructions}]`;
  };

  /**
   * Copy text to clipboard
   */
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /**
   * Format for MLS (typically 4000 char limit, plain text)
   */
  const formatForMLS = (text: string): string => {
    // Remove markdown formatting
    let cleaned = text
      .replace(/\*\*/g, '')
      .replace(/##/g, '')
      .replace(/\n\n/g, ' ')
      .replace(/\n/g, ' ')
      .trim();
    
    // Truncate to MLS limit (typically 4000 chars)
    if (cleaned.length > 4000) {
      cleaned = cleaned.substring(0, 3997) + '...';
    }
    
    return cleaned;
  };

  /**
   * Format for Zillow (250 char limit for short description)
   */
  const formatForZillow = (text: string): string => {
    // Get first paragraph and truncate
    const firstPara = text.split('\n\n')[0] || text;
    let cleaned = firstPara
      .replace(/\*\*/g, '')
      .replace(/##/g, '')
      .trim();
    
    if (cleaned.length > 250) {
      cleaned = cleaned.substring(0, 247) + '...';
    }
    
    return cleaned;
  };

  /**
   * Save project changes
   */
  const handleSave = async () => {
    if (!project) return;

    setIsSaving(true);

    try {
      // Only send essential data (exclude images to reduce payload size)
      const payload = {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        property_type: project.property_type,
        property_info: project.property_info,
        ai_content: project.ai_content ? {
          ...project.ai_content,
          description: editedDescription,
        } : null,
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Check if response is JSON or HTML error page
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();

        if (result.success) {
          setHasUnsavedChanges(false);
          alert('Project saved successfully!');
        } else {
          throw new Error(result.error || 'Save failed');
        }
      } else {
        // Received HTML error page (like Cloudflare error)
        const errorText = await response.text();
        console.error('Save failed with non-JSON response:', response.status, response.statusText);
        console.error('Response preview:', errorText.substring(0, 500));
        throw new Error(`Server error: ${response.status} ${response.statusText}. This might be a temporary Supabase issue.`);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Failed to save project: ${error.message}\n\nIf this persists, check your internet connection or try again in a few minutes.`);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle tone selection
   */
  const handleToneChange = (tone: DescriptionTone) => {
    setSelectedTone(tone);
    const version = toneVersions.find(v => v.tone === tone);
    if (version) {
      setEditedDescription(version.content);
      setProject(prev => prev ? {
        ...prev,
        ai_content: prev.ai_content ? {
          ...prev.ai_content,
          description: version.content,
          instagram: version.instagram || prev.ai_content.instagram,
          facebook: version.facebook || prev.ai_content.facebook,
          selected_tone: tone,
        } : undefined,
      } : null);
      setHasUnsavedChanges(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <Header title="Loading..." subtitle="Please wait" />
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!project) {
    return (
      <div>
        <Header title="Project Not Found" subtitle="This project doesn't exist" />
        <div className="p-6">
          <Card>
            <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push('/dashboard/projects')}>
              Back to Projects
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <Header 
        title={project.title}
        subtitle={project.property_info?.address || 'Project Details'}
      />

      {/* Page content */}
      <div className="p-6 max-w-7xl mx-auto text-white">
        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button onClick={handleSave} isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save Project
          </Button>
          <Button variant="outline" onClick={() => setShowPreviewModal(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/projects')}>
            Back to Projects
          </Button>
          
          {/* Auto-save status indicator */}
          {autoSaveStatus !== 'idle' && (
            <div className={`
              flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300
              ${autoSaveStatus === 'saving' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : ''}
              ${autoSaveStatus === 'saved' ? 'bg-green-500/20 text-green-300 border border-green-400/30' : ''}
              ${autoSaveStatus === 'error' ? 'bg-red-500/20 text-red-300 border border-red-400/30' : ''}
            `}>
              {autoSaveStatus === 'saving' && (
                <>
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <Check className="w-4 h-4" />
                  All changes saved
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <X className="w-4 h-4" />
                  Save failed
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
              {/* Images section */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Property Images</h2>
                  <Button size="sm" onClick={handleImageUpload} disabled={isUploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Images'}
                  </Button>
                </div>

                {project.images && project.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {project.images.map((image, index) => {
                      // Handle both old format (object with url) and new format (direct URL string)
                      const imageUrl = typeof image === 'string' ? image : image.url;
                      const imageId = typeof image === 'string' ? image : image.id;
                      
                      return (
                        <div key={imageId || index} className="relative group">
                          <img
                            src={imageUrl}
                            alt="Property image"
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button 
                              size="sm" 
                              variant="danger"
                              onClick={() => handleDeleteImage(imageUrl)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-lg">
                    <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No images uploaded yet</p>
                    <Button onClick={handleImageUpload} disabled={isUploading}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your First Image
                    </Button>
                  </div>
                )}
              </Card>

              {/* Property information */}
              <Card>
                <h2 className="text-xl font-bold text-white mb-4">Property Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-white">{project.property_info?.address || 'Not specified'}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600">City, State</p>
                    <p className="font-medium text-white">
                      {project.property_info?.city || 'N/A'}, {project.property_info?.state || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600">Property Type</p>
                    <p className="font-medium text-white capitalize">{project.property_type || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600">Bedrooms</p>
                    <p className="font-medium text-white">{project.property_info?.bedrooms || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600">Bathrooms</p>
                    <p className="font-medium text-white">{project.property_info?.bathrooms || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600">Square Feet</p>
                    <p className="font-medium text-white">
                      {project.property_info?.square_feet?.toLocaleString() || 'N/A'} sq ft
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg col-span-full md:col-span-1 border border-blue-400/30">
                    <p className="text-sm text-blue-400">Listing Price</p>
                    <p className="font-bold text-blue-300 text-xl">
                      {project.property_info?.price 
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(project.property_info.price)
                        : 'Price not set'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* AI-generated content */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">AI-Generated Content</h2>
                  <Button 
                    onClick={handleGenerateAI} 
                    isLoading={isGenerating}
                    className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <Sparkles className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
                    {isGenerating ? 'Generating Amazing Content...' : (project.ai_content ? 'Regenerate' : 'Generate') + ' Content'}
                  </Button>
                </div>

                {/* Generating Loading State */}
                {isGenerating && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                        <Sparkles className="w-6 h-6 text-blue-400 absolute top-3 left-3" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">Creating Your Content...</h3>
                        <p className="text-sm text-gray-400">
                          Analyzing images, generating 3 unique descriptions, and crafting social media posts. This may take a minute.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {project.ai_content && !isGenerating ? (
                  <div className="space-y-6">
                    {/* Headline */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Headline
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={project.ai_content.headline || ''}
                          onChange={(e) => {
                            setProject(prev => prev ? {
                              ...prev,
                              ai_content: { ...prev.ai_content!, headline: e.target.value },
                            } : null);
                            setHasUnsavedChanges(true);
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(project.ai_content?.headline || '', 'headline')}
                        >
                          {copiedField === 'headline' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Tone Selection */}
                    {toneVersions.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Description Tone
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {toneVersions.map((version) => (
                            <button
                              key={version.tone}
                              onClick={() => handleToneChange(version.tone)}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                selectedTone === version.tone
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : 'border-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className="font-medium text-white">{version.label}</div>
                              <div className="text-sm text-gray-500">{version.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description with edit and refine options */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Property Description
                        </label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRefineModal(true)}
                          >
                            <Wand2 className="w-4 h-4 mr-1" />
                            AI Refine
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingDescription(!isEditingDescription)}
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            {isEditingDescription ? 'Done' : 'Edit'}
                          </Button>
                        </div>
                      </div>
                      
                      <textarea
                        className={`block w-full rounded-lg border px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isEditingDescription ? 'border-purple-500/50 bg-white/10' : 'border-white/20 bg-white/5'
                        }`}
                        rows={8}
                        value={editedDescription}
                        onChange={(e) => {
                          const newDescription = e.target.value;
                          setEditedDescription(newDescription);
                          
                          // Update the current tone version
                          setToneVersions(prev => prev.map(v => 
                            v.tone === selectedTone ? { ...v, content: newDescription } : v
                          ));
                          
                          // Update project state with the new description
                          setProject(prev => {
                            if (!prev) return prev;
                            
                            // Update tone_versions if they exist
                            const updatedToneVersions = prev.ai_content?.tone_versions ? {
                              ...prev.ai_content.tone_versions,
                              [selectedTone]: {
                                ...prev.ai_content.tone_versions[selectedTone],
                                description: newDescription,
                                instagram: prev.ai_content.tone_versions[selectedTone]?.instagram || prev.ai_content.instagram || '',
                                facebook: prev.ai_content.tone_versions[selectedTone]?.facebook || prev.ai_content.facebook || '',
                              }
                            } : undefined;
                            
                            return {
                              ...prev,
                              ai_content: prev.ai_content ? {
                                ...prev.ai_content,
                                description: newDescription,
                                tone_versions: updatedToneVersions,
                              } : undefined,
                            };
                          });
                          
                          // Trigger auto-save
                          setHasUnsavedChanges(true);
                        }}
                        readOnly={!isEditingDescription}
                      />
                      
                      {/* Copy buttons for different platforms */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(editedDescription, 'full')}
                        >
                          {copiedField === 'full' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                          Copy Full
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(formatForMLS(editedDescription), 'mls')}
                        >
                          {copiedField === 'mls' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                          Copy for MLS ({formatForMLS(editedDescription).length}/4000 chars)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(formatForZillow(editedDescription), 'zillow')}
                        >
                          {copiedField === 'zillow' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                          Copy for Zillow ({formatForZillow(editedDescription).length}/250 chars)
                        </Button>
                      </div>
                    </div>

                    {/* Key features */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Key Features
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {project.ai_content.key_features?.map((feature, index) => (
                          <span 
                            key={index} 
                            className="group relative px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300 hover:bg-white/20 transition-all duration-200 pr-8"
                          >
                            {feature}
                            <button
                              onClick={() => handleDeleteKeyFeature(index)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-100 rounded-full"
                              aria-label="Delete feature"
                            >
                              <X className="w-3 h-3 text-red-600" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Social media posts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-300">
                            Instagram Caption
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(project.ai_content?.instagram || '', 'instagram')}
                          >
                            {copiedField === 'instagram' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <textarea
                          className="block w-full rounded-lg border border-white/20 px-4 py-2 text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                          rows={4}
                          value={project.ai_content?.instagram || ''}
                          onChange={(e) => {
                            const newInstagram = e.target.value;
                            setProject(prev => {
                              if (!prev) return prev;
                              
                              // Update the tone_versions if they exist
                              const updatedToneVersions = prev.ai_content?.tone_versions ? {
                                ...prev.ai_content.tone_versions,
                                [selectedTone]: {
                                  ...prev.ai_content.tone_versions[selectedTone],
                                  description: prev.ai_content.tone_versions[selectedTone]?.description || prev.ai_content.description || '',
                                  instagram: newInstagram,
                                  facebook: prev.ai_content.tone_versions[selectedTone]?.facebook || prev.ai_content.facebook || '',
                                }
                              } : undefined;
                              
                              return {
                                ...prev,
                                ai_content: { 
                                  ...prev.ai_content!, 
                                  instagram: newInstagram,
                                  tone_versions: updatedToneVersions,
                                },
                              };
                            });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-300">
                            Facebook Post
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(project.ai_content?.facebook || '', 'facebook')}
                          >
                            {copiedField === 'facebook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <textarea
                          className="block w-full rounded-lg border border-white/20 px-4 py-2 text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                          rows={4}
                          value={project.ai_content?.facebook || ''}
                          onChange={(e) => {
                            const newFacebook = e.target.value;
                            setProject(prev => {
                              if (!prev) return prev;
                              
                              // Update the tone_versions if they exist
                              const updatedToneVersions = prev.ai_content?.tone_versions ? {
                                ...prev.ai_content.tone_versions,
                                [selectedTone]: {
                                  ...prev.ai_content.tone_versions[selectedTone],
                                  description: prev.ai_content.tone_versions[selectedTone]?.description || prev.ai_content.description || '',
                                  instagram: prev.ai_content.tone_versions[selectedTone]?.instagram || prev.ai_content.instagram || '',
                                  facebook: newFacebook,
                                }
                              } : undefined;
                              
                              return {
                                ...prev,
                                ai_content: { 
                                  ...prev.ai_content!, 
                                  facebook: newFacebook,
                                  tone_versions: updatedToneVersions,
                                },
                              };
                            });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-lg">
                    <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No AI content generated yet</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Click the button above to generate compelling marketing content with multiple tone variations
                    </p>
                    <Button onClick={handleGenerateAI} isLoading={isGenerating}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content
                    </Button>
                  </div>
                )}
              </Card>

          {/* Tasks & Events Section */}
          <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Project Tasks & Events
                </h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard/calendar')}
                >
                  Manage in Calendar
                </Button>
              </div>
              
              {relatedTasks.length > 0 ? (
                <div className="space-y-3">
                  {relatedTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="p-4 border border-white/10 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.start_time).toLocaleString()}
                            </span>
                            {task.location && <span>📍 {task.location}</span>}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.event_type === 'showing' ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' :
                          task.event_type === 'open_house' ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
                          task.event_type === 'meeting' ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' :
                          'bg-white/10 text-gray-300 border border-white/10'
                        }`}>
                          {task.event_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-lg">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No tasks linked to this project yet</p>
                  <Button onClick={() => router.push('/dashboard/calendar')}>
                    Go to Calendar
                  </Button>
                </div>
              )}
            </Card>

          {/* Transactions Section */}
          <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Project Transactions
                </h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard/transactions/new')}
                >
                  New Transaction
                </Button>
              </div>
              
              {relatedTransactions.length > 0 ? (
                <div className="space-y-3">
                  {relatedTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="p-4 border border-white/10 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/transactions/${transaction.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{transaction.property_address}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Buyer: {transaction.buyer_name}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm font-medium text-blue-600">
                              {transaction.offer_price 
                                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(transaction.offer_price)
                                : 'Price not set'}
                            </span>
                            {transaction.closing_date && (
                              <span className="text-xs text-gray-500">
                                Closing: {new Date(transaction.closing_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          transaction.status === 'active' ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' :
                          transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
                          transaction.status === 'under_contract' ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' :
                          transaction.status === 'closed' ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
                          'bg-white/10 text-gray-300 border border-white/10'
                        }`}>
                          {transaction.status === 'under_contract' ? 'Under Contract' : 
                           transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-lg">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No transactions linked to this project yet</p>
                  <Button onClick={() => router.push('/dashboard/transactions/new')}>
                    Create Transaction
                  </Button>
                </div>
              )}
            </Card>
        </div>
      </div>

      {/* Generation Results Modal */}
      {showGenerationModal && (
        <Modal
          isOpen={showGenerationModal}
          onClose={() => setShowGenerationModal(false)}
          title="Choose Your Description Style"
          size="xl"
        >
          <div className="space-y-6">
            {/* Tone Selector */}
            <div className="grid grid-cols-3 gap-3">
              {generationResults.map((version) => (
                <button
                  key={version.tone}
                  onClick={() => setSelectedGenerationTone(version.tone)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-300 transform hover:scale-105 ${
                    selectedGenerationTone === version.tone
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg scale-105'
                      : 'border-white/10 hover:border-white/20 hover:shadow-md'
                  }`}
                >
                  <div className="font-semibold text-white mb-1">{version.label}</div>
                  <div className="text-xs text-gray-500">{version.description}</div>
                </button>
              ))}
            </div>

            {/* Content Preview with Animation */}
            <div className="transition-all duration-500 ease-in-out">
              {generationResults.map((version) => (
                <div
                  key={version.tone}
                  className={`space-y-4 transition-all duration-300 ${
                    selectedGenerationTone === version.tone
                      ? 'opacity-100 max-h-screen'
                      : 'opacity-0 max-h-0 overflow-hidden'
                  }`}
                >
                  {selectedGenerationTone === version.tone && (
                    <>
                      {/* Description */}
                      <div className="animate-fadeIn">
                        <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          Property Description
                        </label>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 max-h-60 overflow-y-auto">
                          <p className="text-gray-200 leading-relaxed whitespace-pre-line">{version.content}</p>
                        </div>
                      </div>

                      {/* Social Media Posts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn" style={{ animationDelay: '100ms' }}>
                        {/* Instagram */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/><path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            Instagram
                          </label>
                          <textarea
                            readOnly
                            className="block w-full rounded-lg border border-white/20 px-3 py-2 text-sm text-white bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            rows={6}
                            value={version.instagram}
                          />
                        </div>

                        {/* Facebook */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook
                          </label>
                          <textarea
                            readOnly
                            className="block w-full rounded-lg border border-white/20 px-3 py-2 text-sm text-white bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            rows={6}
                            value={version.facebook}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <Button variant="outline" onClick={() => setShowGenerationModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleApplySelectedTone} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300">
                <Check className="w-4 h-4 mr-2" />
                Use This Style
              </Button>
            </div>
          </div>

          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.5s ease-out forwards;
            }
          `}</style>
        </Modal>
      )}

      {/* AI Refine Modal */}
      {showRefineModal && (
        <Modal
          isOpen={showRefineModal}
          onClose={() => setShowRefineModal(false)}
          title="Refine with AI"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Tell the AI how you'd like to refine the description. For example:
            </p>
            <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
              <li>"Make it shorter and more concise"</li>
              <li>"Add more details about the kitchen"</li>
              <li>"Emphasize the outdoor space"</li>
              <li>"Remove mentions of the garage"</li>
              <li>"Make it sound more luxurious"</li>
            </ul>
            <textarea
              className="block w-full rounded-lg border border-white/20 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-800"
              rows={4}
              placeholder="Tell the AI what changes you want..."
              value={refineInstructions}
              onChange={(e) => setRefineInstructions(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRefineModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleRefineWithAI} 
                isLoading={isRefining}
                disabled={!refineInstructions.trim()}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Refine Description
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Listing Preview"
          size="lg"
        >
          <ZillowStylePreview 
            project={project} 
            description={editedDescription || project.ai_content?.description || ''}
            inModal
          />
        </Modal>
      )}
    </div>
  );
}

/**
 * Zillow-Style Listing Preview Component
 */
function ZillowStylePreview({ 
  project, 
  description, 
  inModal = false 
}: { 
  project: Project; 
  description: string;
  inModal?: boolean;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = project.images || [];
  const info = project.property_info || {};
  
  // Normalize images to URL strings (handle both formats)
  const imageUrls = images.map(img => typeof img === 'string' ? img : img.url);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  return (
    <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg overflow-hidden border border-white/10`}>
      {/* Hero Image Gallery */}
      <div className="relative bg-gray-900">
        {imageUrls.length > 0 ? (
          <>
            <div className="aspect-[16/9] md:aspect-[21/9]">
              <img
                src={imageUrls[currentImageIndex]}
                alt="Property image"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Image Navigation */}
            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/70 backdrop-blur-sm rounded-full shadow-lg hover:bg-black/90 transition-colors border border-white/20"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-200" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/70 backdrop-blur-sm rounded-full shadow-lg hover:bg-black/90 transition-colors border border-white/20"
                >
                  <ChevronRight className="w-6 h-6 text-gray-200" />
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                  {currentImageIndex + 1} / {imageUrls.length}
                </div>
              </>
            )}
            
            {/* Thumbnail Strip */}
            {imageUrls.length > 1 && (
              <div className="absolute bottom-4 left-4 flex gap-2">
                {imageUrls.slice(0, 5).map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {imageUrls.length > 5 && (
                  <div className="w-16 h-12 rounded bg-black/70 flex items-center justify-center text-white text-sm">
                    +{imageUrls.length - 5}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="aspect-[16/9] md:aspect-[21/9] flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <Home className="w-16 h-16 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No photos available</p>
            </div>
          </div>
        )}
      </div>

      {/* Listing Details */}
      <div className="p-6 md:p-8">
        {/* Price and Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-white">
              {info.price 
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(info.price)
                : 'Price Upon Request'}
            </div>
            {info.price && info.square_feet && (
              <div className="text-sm text-gray-500 mt-1">
                ${Math.round(info.price / info.square_feet).toLocaleString()}/sq ft
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium border border-green-400/30">
              For Sale
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              project.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' :
              project.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
              'bg-white/10 text-gray-300 border border-white/10'
            }`}>
              {project.status === 'completed' ? 'Active' : 
               project.status === 'in_progress' ? 'Coming Soon' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Key Stats */}
        <div className="flex flex-wrap gap-6 mb-6 py-4 border-y border-white/10">
          {info.bedrooms && (
            <div className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-gray-600" />
              <span className="text-lg font-semibold text-white">{info.bedrooms}</span>
              <span className="text-gray-600">beds</span>
            </div>
          )}
          {info.bathrooms && (
            <div className="flex items-center gap-2">
              <Bath className="w-5 h-5 text-gray-600" />
              <span className="text-lg font-semibold text-white">{info.bathrooms}</span>
              <span className="text-gray-600">baths</span>
            </div>
          )}
          {info.square_feet && (
            <div className="flex items-center gap-2">
              <Square className="w-5 h-5 text-gray-600" />
              <span className="text-lg font-semibold text-white">{info.square_feet.toLocaleString()}</span>
              <span className="text-gray-600">sq ft</span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 mb-6">
          <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-lg font-semibold text-white">
              {info.address || project.title}
            </div>
            <div className="text-gray-600">
              {[info.city, info.state, info.zip_code].filter(Boolean).join(', ')}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">About this home</h3>
          <div className="text-gray-300 leading-relaxed whitespace-pre-line">
            {description || 'No description available. Generate AI content to create a compelling listing description.'}
          </div>
        </div>

        {/* Key Features */}
        {project.ai_content?.key_features && project.ai_content.key_features.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {project.ai_content.key_features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Property Details Grid */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Property Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Type</div>
              <div className="font-medium text-white capitalize">{project.property_type || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Year Built</div>
              <div className="font-medium text-white">{info.year_built || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Lot Size</div>
              <div className="font-medium text-white">{info.lot_size || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">ZIP Code</div>
              <div className="font-medium text-white">{info.zip_code || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
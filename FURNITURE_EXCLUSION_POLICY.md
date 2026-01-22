# Furniture Exclusion Policy for Listing Descriptions

## Overview
All AI-generated property descriptions now **exclude furniture and staging items**, focusing exclusively on permanent features of the property.

## Why This Matters
Property listings should describe what comes with the home - not the furniture used for staging. This ensures:
- ✅ Buyers understand what's included
- ✅ No confusion about staged items
- ✅ Focus on the property's actual value
- ✅ Professional, accurate descriptions

## What Gets EXCLUDED

### Furniture Items
❌ Sofas, couches, sectionals
❌ Chairs, armchairs, dining chairs  
❌ Tables (coffee, dining, side tables)
❌ Beds, dressers, nightstands
❌ Bookshelves (non-built-in)
❌ Desks and office furniture

### Staging & Decor
❌ Artwork and wall decorations
❌ Lamps and portable lighting
❌ Rugs and carpets (non-permanent)
❌ Decorative objects and accessories
❌ Pillows, throws, linens
❌ Potted plants and flowers
❌ Personal items and photographs

### Temporary Items
❌ Window treatments (if not custom/built-in)
❌ Seasonal decorations
❌ Portable appliances (toasters, blenders, etc.)

## What Gets INCLUDED

### Permanent Features
✅ Built-in cabinetry and shelving
✅ Appliances (when built-in or included)
✅ Countertops and backsplashes
✅ Flooring (hardwood, tile, carpet)
✅ Lighting fixtures (ceiling, wall-mounted)
✅ Windows and window frames
✅ Doors and hardware
✅ Moldings and trim work

### Materials & Finishes
✅ Marble, granite, quartz surfaces
✅ Hardwood species and finishes
✅ Tile work and patterns
✅ Stone and brick work
✅ Custom cabinetry finishes
✅ Paint colors and textures

### Architectural Elements
✅ Staircases and railings
✅ Columns and pillars
✅ Ceiling details (coffered, tray, vaulted)
✅ Fireplaces and mantels
✅ Built-in shelving and bookcases
✅ Custom closet systems
✅ Window seats (built-in)

### Fixtures & Appliances
✅ Kitchen appliances (with brands: Wolf, SubZero, etc.)
✅ Bathroom fixtures (sinks, tubs, showers)
✅ Faucets and hardware
✅ Light fixtures and chandeliers
✅ HVAC vents and thermostats
✅ Built-in audio/visual systems

### Outdoor Features
✅ Landscaping (trees, shrubs, lawn)
✅ Hardscaping (patios, walkways, retaining walls)
✅ Pools and spas
✅ Outdoor kitchens and built-in grills
✅ Gazebos, pergolas, and permanent structures
✅ Fencing and gates
✅ Irrigation systems
✅ Outdoor lighting (permanent)

## Implementation

### Image Analysis (lib/openai.ts)
The AI vision system is instructed to:
```
IDENTIFY ONLY:
- Built-in features and appliances
- Materials and finishes
- Architectural details
- Permanent fixtures
- Landscaping and outdoor permanent features

DO NOT IDENTIFY:
- Furniture
- Staging items
- Temporary decorations
```

### Description Generation (api/ai/generate-content/route.ts)
The AI content generator is instructed:
```
CRITICAL - DO NOT INCLUDE:
- DO NOT mention furniture, staging items, or temporary decorations
- DO NOT mention sofas, chairs, tables, beds, artwork, rugs, lamps, 
  or any furnishings
- Focus ONLY on permanent features: architecture, built-ins, appliances, 
  fixtures, finishes, materials
```

## Examples

### ❌ WRONG (Mentions Furniture)
> "The living room features a beautiful sectional sofa positioned near the 
> stone fireplace, with elegant side tables and a plush area rug creating 
> a cozy atmosphere."

### ✅ CORRECT (Permanent Features Only)
> "The living room captivates with its floor-to-ceiling stone fireplace, 
> rich hardwood flooring, and soaring ceilings with custom crown molding, 
> creating an atmosphere of refined elegance."

### ❌ WRONG (Mentions Staging)
> "The bedroom showcases a king-size bed dressed in luxury linens, with 
> decorative pillows and artwork adorning the walls."

### ✅ CORRECT (Permanent Features Only)
> "The primary bedroom evokes pure tranquility with its premium hardwood 
> flooring, custom walk-in closet with built-in shelving, and expansive 
> windows flooding the space with natural light."

### ❌ WRONG (Mentions Decor)
> "The kitchen is beautifully styled with modern bar stools at the island 
> and pendant lamps hanging above."

### ✅ CORRECT (Permanent Features Only)
> "The kitchen features professional-grade stainless steel appliances, 
> pristine quartz countertops, custom white cabinetry, and designer 
> pendant lighting fixtures."

## Edge Cases

### Built-In vs. Furniture
**Question**: Is a window seat furniture?
**Answer**: If it's built-in (permanent construction), include it. If it's a separate piece of furniture, exclude it.

**Question**: Are curtains/drapes included?
**Answer**: Generally no, unless they're custom-installed as part of the home and included in the sale.

**Question**: What about a Murphy bed?
**Answer**: Include it - it's a built-in feature of the home.

### Appliances
**Question**: What about the refrigerator?
**Answer**: Include if it's a built-in unit or explicitly part of the sale. Use brand names (SubZero, Viking, etc.) when visible.

**Question**: Microwave on the counter?
**Answer**: Exclude countertop appliances. Include if it's a built-in microwave.

### Outdoor Items
**Question**: What about patio furniture?
**Answer**: Exclude. Focus on the permanent patio/deck itself.

**Question**: Outdoor grill?
**Answer**: Exclude portable grills. Include built-in outdoor kitchens.

**Question**: Potted plants?
**Answer**: Exclude potted plants. Include permanent landscaping (trees, shrubs, lawn).

## Benefits

1. **Accuracy**: Descriptions match what buyers actually get
2. **Legal Protection**: Avoids confusion about what's included
3. **Professional**: Industry-standard approach
4. **Clarity**: Focuses on property value, not staging
5. **Consistency**: All descriptions follow the same rules

## Compliance

All three tone variations follow this policy:
- ✅ Professional Tone
- ✅ Casual Tone  
- ✅ Luxury Tone

Both generation methods enforce this:
- ✅ OpenAI API Generation
- ✅ Fallback Template Generation

## Testing

To verify compliance, look for:
- ❌ No mentions of sofas, chairs, tables, beds
- ❌ No mentions of artwork, rugs, lamps
- ❌ No mentions of decorative items
- ✅ Focus on materials (marble, granite, hardwood)
- ✅ Focus on appliances (Wolf, SubZero, etc.)
- ✅ Focus on built-ins and fixtures

---

**This policy ensures every listing description focuses on what truly matters: the property itself.** 🏡








# Getting Started Guide - Quick Setup in 5 Minutes

This guide will help you get the RealEstate SaaS application running on your local machine quickly.

## Step 1: Install Dependencies (1 minute)

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all the necessary packages including Next.js, React, Tailwind CSS, Supabase, and OpenAI.

## Step 2: Set Up Supabase (2 minutes)

### 2.1 Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (it's free!)
3. Create a new project (give it any name you like)
4. Wait about 2 minutes for your project to be set up

### 2.2 Get Your Supabase Credentials

1. In your Supabase dashboard, click on the "Settings" icon (gear icon)
2. Go to "API" section
3. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### 2.3 Set Up the Database

1. In your Supabase dashboard, click on the "SQL Editor" icon
2. Click "New query"
3. Open the `supabase-schema.sql` file from this project
4. Copy all the contents and paste into the SQL editor
5. Click "Run" (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned" - this means it worked!

### 2.4 Enable Google Authentication (Optional)

1. In Supabase dashboard, go to "Authentication" > "Providers"
2. Find "Google" and toggle it on
3. Follow the instructions to set up Google OAuth (you'll need a Google Cloud project)
4. For now, you can skip this and just use email/password authentication

## Step 3: Get OpenAI API Key (1 minute)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Click on your profile icon > "View API keys"
4. Click "Create new secret key"
5. Copy the key (it starts with `sk-...`)
6. **Important**: You need to add payment information to OpenAI to use the API (they give you $5 free credits)

## Step 4: Configure Environment Variables (1 minute)

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Open `.env.local` in your text editor

3. Replace the placeholders with your actual credentials:

```env
# Supabase Configuration (from Step 2.2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI Configuration (from Step 3)
OPENAI_API_KEY=sk-your-openai-key-here

# App Configuration (keep as is for local development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Save the file

## Step 5: Run the Application!

```bash
npm run dev
```

Open your browser and go to [http://localhost:3000](http://localhost:3000)

You should see the beautiful landing page! 🎉

## Next Steps

### Try It Out

1. **Sign Up**: Click "Get Started" and create an account
2. **Create a Project**: From the dashboard, click "New Project"
3. **Add Property Details**: Fill in information about a property
4. **Upload Images**: Add photos of the property (you can use sample images from Unsplash)
5. **Generate AI Content**: Click the "Generate Content" button to create marketing copy
6. **Customize Brand Kit**: Go to "Brand Kit" and set your colors and fonts

### Understanding the Code

The codebase is heavily commented to help beginners learn. Start by exploring:

1. **`app/page.tsx`** - The landing page (good place to see how pages work)
2. **`components/ui/Button.tsx`** - A simple reusable component
3. **`lib/supabase.ts`** - How authentication works
4. **`types/index.ts`** - All the TypeScript type definitions

### Common Issues and Solutions

#### Issue: "Supabase client error"
- **Solution**: Double-check your `.env.local` file has the correct Supabase URL and key
- **Solution**: Make sure you ran the `supabase-schema.sql` script

#### Issue: "OpenAI API error"
- **Solution**: Verify your API key is correct in `.env.local`
- **Solution**: Make sure you've added payment information to your OpenAI account

#### Issue: "Module not found" errors
- **Solution**: Run `npm install` again
- **Solution**: Delete `node_modules` folder and `.next` folder, then run `npm install`

#### Issue: Port 3000 is already in use
- **Solution**: Run `npm run dev -- -p 3001` to use a different port

### Learning Path

If you're new to these technologies, here's a recommended learning order:

1. **HTML/CSS Basics** - Understand the building blocks
2. **JavaScript/TypeScript** - Learn the programming language
3. **React Basics** - Learn components, props, and state
4. **Next.js** - Understand the framework
5. **Tailwind CSS** - Learn utility-first CSS
6. **APIs and Databases** - Understand how data flows

### Helpful Resources

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features
- [React Documentation](https://react.dev) - Learn React fundamentals
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Learn Tailwind utilities
- [Supabase Documentation](https://supabase.com/docs) - Learn about authentication and databases
- [OpenAI API Documentation](https://platform.openai.com/docs) - Learn about AI features

## Need Help?

- Check the comments in the code files - they explain everything!
- Read the main `README.md` for more detailed information
- Look at the type definitions in `types/index.ts` to understand data structures

---

Happy coding! 🚀 You're now ready to build amazing real estate marketing tools with AI!


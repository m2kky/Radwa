---
trigger: always_on
---

STYLING RULES
=============

Guidelines for styling and design in Radwa Platform

Last Updated: February 15, 2026

TAILWIND CSS BASICS
-------------------

Use Tailwind utility classes for all styling.
Never use inline styles or custom CSS unless absolutely necessary.

Good:
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-bold mb-4">Title</h2>
    <p className="text-gray-600">Text content</p>
  </div>

Bad:
  <div style={{ backgroundColor: 'white', padding: '24px' }}>
    <h2 style={{ fontSize: '24px' }}>Title</h2>
  </div>

DESIGN SYSTEM COLORS
--------------------

Use CSS variables defined in globals.css:

Brand Colors:
  brand-primary        Main brand color (primary blue)
  brand-secondary      Secondary brand color
  brand-accent         Accent/background color

UI Colors:
  background           Page background
  foreground           Main text color
  card                 Card background
  card-foreground      Card text color
  popover              Popover background
  popover-foreground   Popover text

Interactive:
  primary              Primary button/link
  primary-foreground   Primary button text
  secondary            Secondary button
  secondary-foreground Secondary button text
  accent               Accent elements
  accent-foreground    Accent text

Status:
  destructive          Error/delete actions
  destructive-foreground  Destructive text
  success              Success state
  warning              Warning state
  info                 Info state

Borders:
  border               Border color
  input                Input border
  ring                 Focus ring

Text:
  muted                Muted/secondary text
  muted-foreground     Muted text color

Usage:
  <div className="bg-brand-primary text-white">
  <Button className="bg-destructive text-destructive-foreground">
  <p className="text-muted-foreground">

TYPOGRAPHY SCALE
-----------------

Heading sizes:
  text-h1    3rem (48px) - Page titles
  text-h2    2.5rem (40px) - Section titles
  text-h3    2rem (32px) - Subsection titles
  text-h4    1.5rem (24px) - Component titles

Body text:
  text-body-lg    1.125rem (18px) - Large body
  text-body       1rem (16px) - Default body
  text-body-sm    0.875rem (14px) - Small text
  text-caption    0.75rem (12px) - Captions

Font weights:
  font-normal     400
  font-medium     500
  font-semibold   600
  font-bold       700

Line heights:
  leading-tight    1.25
  leading-normal   1.5
  leading-relaxed  1.75

Example:
  <h1 className="text-h1 font-bold mb-4">Page Title</h1>
  <p className="text-body text-muted-foreground">Regular text</p>

SPACING SYSTEM
--------------

Use consistent spacing scale:

  p-0     0px
  p-1     4px
  p-2     8px
  p-3     12px
  p-4     16px
  p-6     24px
  p-8     32px
  p-12    48px
  p-16    64px
  p-24    96px

Margin (same scale):
  m-0, m-1, m-2, m-4, m-6, etc.

Gap for flex/grid:
  gap-2   8px
  gap-4   16px
  gap-6   24px

Common patterns:
  Section spacing: py-16 (vertical) or py-12 (smaller)
  Card padding: p-6
  Container: container mx-auto px-4
  Element spacing: mb-4 or mb-6

RESPONSIVE DESIGN
-----------------

Mobile-first approach. Default styles are for mobile.

Breakpoints:
  sm    640px   Small devices
  md    768px   Tablets
  lg    1024px  Laptops
  xl    1280px  Desktops
  2xl   1536px  Large screens

Examples:
  <div className="text-sm md:text-base lg:text-lg">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div className="p-4 md:p-6 lg:p-8">

Hide on mobile:
  <div className="hidden md:block">

Show only on mobile:
  <div className="block md:hidden">

Responsive containers:
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">

SHADCN UI COMPONENTS
--------------------

Use Shadcn components from components/ui directory.
Never modify these files directly.

Common components:
  Button
  Input
  Textarea
  Select
  Checkbox
  Radio
  Switch
  Card, CardHeader, CardContent, CardFooter
  Dialog, DialogTrigger, DialogContent
  DropdownMenu
  Tabs
  Badge
  Avatar
  Skeleton
  Toast

Import:
  import { Button } from '@/components/ui/button'
  import { Card } from '@/components/ui/card'

Button variants:
  <Button variant="default">Default</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="destructive">Delete</Button>

Button sizes:
  <Button size="sm">Small</Button>
  <Button size="default">Default</Button>
  <Button size="lg">Large</Button>

Card structure:
  <Card>
    <CardHeader>
      <h3>Title</h3>
    </CardHeader>
    <CardContent>
      <p>Content</p>
    </CardContent>
    <CardFooter>
      <Button>Save</Button>
    </CardFooter>
  </Card>

COMMON LAYOUT PATTERNS
-----------------------

Page container:
  <div className="container mx-auto px-4 py-16">
    <h1 className="text-h1 font-bold mb-8">Title</h1>
    {/* Content */}
  </div>

Two column layout:
  <div className="grid md:grid-cols-2 gap-8">
    <div>Column 1</div>
    <div>Column 2</div>
  </div>

Three column grid:
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card>Card 1</Card>
    <Card>Card 2</Card>
    <Card>Card 3</Card>
  </div>

Flex center:
  <div className="flex items-center justify-center min-h-screen">
    <div>Centered content</div>
  </div>

Sticky header:
  <header className="sticky top-0 z-50 bg-white border-b">
    {/* Header content */}
  </header>

HOVER AND FOCUS STATES
-----------------------

Add hover effects to interactive elements:

Button hover:
  <button className="hover:bg-blue-700 transition-colors">

Card hover:
  <div className="hover:shadow-lg transition-shadow">

Link hover:
  <a className="hover:text-blue-600 transition-colors">

Focus states:
  <button className="focus:outline-none focus:ring-2 focus:ring-blue-500">

Transitions:
  transition-colors    Color transitions
  transition-all       All property transitions
  transition-transform Transform transitions
  duration-200         200ms duration

LOADING STATES
--------------

Skeleton loaders:
  import { Skeleton } from '@/components/ui/skeleton'
  
  <div className="space-y-4">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>

Spinner:
  import { Loader2 } from 'lucide-react'
  
  <Loader2 className="h-8 w-8 animate-spin" />

Loading button:
  <Button disabled={loading}>
    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {loading ? 'Loading...' : 'Submit'}
  </Button>

ICONS
-----

Use Lucide React icons:

  import { Search, User, Settings, ChevronRight } from 'lucide-react'
  
  <Search className="h-5 w-5" />
  <User className="h-6 w-6 text-gray-500" />

Icon sizes:
  h-4 w-4    16px - Small icons
  h-5 w-5    20px - Default
  h-6 w-6    24px - Large
  h-8 w-8    32px - Extra large

Icon in button:
  <Button>
    <Plus className="mr-2 h-4 w-4" />
    Add New
  </Button>

FORMS
-----

Form field structure:
  <div className="space-y-2">
    <label className="text-sm font-medium">Name</label>
    <Input placeholder="Enter your name" />
    <p className="text-sm text-muted-foreground">Helper text</p>
  </div>

Error state:
  <div className="space-y-2">
    <label className="text-sm font-medium text-destructive">Email</label>
    <Input
      className="border-destructive"
      placeholder="Email address"
    />
    <p className="text-sm text-destructive">Invalid email</p>
  </div>

Form layout:
  <form className="space-y-6">
    <div className="space-y-2">
      {/* Field 1 */}
    </div>
    <div className="space-y-2">
      {/* Field 2 */}
    </div>
    <Button type="submit">Submit</Button>
  </form>

IMAGES
------

Always use Next.js Image component:

  import Image from 'next/image'
  
  <Image
    src="/path/to/image.jpg"
    alt="Image description"
    width={400}
    height={300}
    className="rounded-lg"
  />

For dynamic sizes:
  <div className="relative w-full h-64">
    <Image
      src={imageUrl}
      alt="Description"
      fill
      className="object-cover rounded-lg"
    />
  </div>

Avatar:
  import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
  
  <Avatar>
    <AvatarImage src={user.avatar} />
    <AvatarFallback>J</AvatarFallback>
  </Avatar>

ANIMATIONS
----------

Fade in:
  <div className="animate-in fade-in duration-300">

Slide in:
  <div className="animate-in slide-in-from-bottom duration-500">

Scale:
  <div className="hover:scale-105 transition-transform">

Pulse (loading):
  <div className="animate-pulse bg-gray-200 h-8 w-full rounded">

ACCESSIBILITY
-------------

Always add proper labels:
  <label htmlFor="email">Email Address</label>
  <Input id="email" type="email" />

Use semantic HTML:
  <nav>
  <main>
  <section>
  <article>
  <aside>
  <footer>

Alt text for images:
  <Image src={url} alt="Clear description of image" />

ARIA labels for icons:
  <button aria-label="Search">
    <Search className="h-5 w-5" />
  </button>

Focus visible:
  <button className="focus-visible:ring-2 focus-visible:ring-blue-500">

COMMON MISTAKES
---------------

Using inline styles:
  Bad: <div style={{ margin: '20px' }}>
  Good: <div className="m-5">

Hardcoded colors:
  Bad: <div className="bg-[#3b82f6]">
  Good: <div className="bg-brand-primary">

Not responsive:
  Bad: <div className="w-96">
  Good: <div className="w-full md:w-96">

Inconsistent spacing:
  Bad: <div className="mt-3 mb-7 ml-2">
  Good: <div className="m-4"> or <div className="my-4 mx-2">

Not using design system:
  Bad: <div className="text-gray-500">
  Good: <div className="text-muted-foreground">

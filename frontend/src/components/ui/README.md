# UI Components

A suite of reusable UI components built with Vue 3 and styled with Tailwind CSS.

## Components

### Layout Components

#### `Card`
A container component with white background, rounded corners, and subtle shadow.

```vue
<Card>
  <!-- content -->
</Card>

<!-- Without padding -->
<Card no-padding>
  <!-- content -->
</Card>
```

**Props:**
- `noPadding?: boolean` - Remove default padding (default: `false`)

---

#### `CardHeader`
A header component for cards with title and optional actions slot.

```vue
<CardHeader title="Page Title">
  <template #actions>
    <Button>Action</Button>
  </template>
</CardHeader>
```

**Props:**
- `title: string` - The header title

**Slots:**
- `actions` - Optional slot for action buttons/links

---

### Form Components

#### `Button`
A versatile button component with multiple variants.

```vue
<Button type="submit" variant="primary" :disabled="loading">
  Submit
</Button>
```

**Props:**
- `variant?: 'primary' | 'secondary' | 'text'` - Button style (default: `'primary'`)
- `type?: 'button' | 'submit' | 'reset'` - Button type (default: `'button'`)
- `disabled?: boolean` - Disable the button (default: `false`)

**Variants:**
- `primary` - Blue button with white text
- `secondary` - Gray button
- `text` - Text-only button with no background

---

#### `Input`
A text input component.

```vue
<Input v-model="name" type="text" required placeholder="Enter name" />
```

**Props:**
- `modelValue: string` - The input value (v-model)
- `type?: 'text' | 'email' | 'password' | 'number' | 'url'` - Input type (default: `'text'`)
- `required?: boolean` - Mark as required (default: `false`)
- `placeholder?: string` - Placeholder text

**Emits:**
- `update:modelValue(value: string)` - Emitted when value changes

---

#### `Textarea`
A multi-line text input component.

```vue
<Textarea v-model="description" :rows="5" placeholder="Enter description" />
```

**Props:**
- `modelValue: string` - The textarea value (v-model)
- `rows?: number` - Number of visible rows (default: `3`)
- `required?: boolean` - Mark as required (default: `false`)
- `placeholder?: string` - Placeholder text

**Emits:**
- `update:modelValue(value: string)` - Emitted when value changes

---

#### `FormField`
A wrapper component that combines a label with form controls.

```vue
<FormField label="Email" required>
  <Input v-model="email" type="email" />
</FormField>
```

**Props:**
- `label: string` - The field label
- `required?: boolean` - Show required indicator (default: `false`)

**Slots:**
- Default slot for the input/textarea component

---

### Navigation Components

#### `Link`
A styled router link component with multiple variants.

```vue
<Link to="/forms" variant="button">Create Form</Link>
<Link to="/home" variant="text">← Back</Link>
```

**Props:**
- `to: RouteLocationRaw` - The target route
- `variant?: 'primary' | 'button' | 'text'` - Link style (default: `'text'`)

**Variants:**
- `button` - Styled as a primary button
- `text` - Blue text link with hover underline
- `primary` - Bold blue text link

---

### Data Display Components

#### `Table`
A responsive table wrapper component.

```vue
<Table>
  <thead>
    <tr>
      <TableHeader>Name</TableHeader>
      <TableHeader align="right">Actions</TableHeader>
    </tr>
  </thead>
  <tbody>
    <tr>
      <TableCell label="Name">John Doe</TableCell>
      <TableCell label="Actions" align="right">
        <Link to="/edit">Edit</Link>
      </TableCell>
    </tr>
  </tbody>
</Table>
```

**Features:**
- Automatic overflow handling
- Responsive on mobile (stacks cells vertically)

---

#### `TableHeader`
A table header cell component.

```vue
<TableHeader align="right">Actions</TableHeader>
```

**Props:**
- `align?: 'left' | 'center' | 'right'` - Text alignment (default: `'left'`)

---

#### `TableCell`
A table data cell component with responsive label support.

```vue
<TableCell label="Email" align="left">
  john@example.com
</TableCell>
```

**Props:**
- `label?: string` - Label shown on mobile (via `data-label` attribute)
- `align?: 'left' | 'center' | 'right'` - Text alignment (default: `'left'`)

---

### Feedback Components

#### `StatusText`
A text component for displaying status messages with different styles.

```vue
<StatusText>Loading...</StatusText>
<StatusText variant="error">Something went wrong</StatusText>
<StatusText variant="success">Saved successfully!</StatusText>
<StatusText variant="muted">Last updated: 2 hours ago</StatusText>
```

**Props:**
- `variant?: 'default' | 'error' | 'success' | 'muted'` - Message style (default: `'default'`)

**Variants:**
- `default` - Gray text
- `error` - Red text, medium weight
- `success` - Green text
- `muted` - Light gray text

---

## Usage Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  Button,
  Card,
  CardHeader,
  FormField,
  Input,
  Link,
  StatusText,
  Table,
  TableCell,
  TableHeader,
  Textarea,
} from '@/components/ui'

const name = ref('')
const description = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
</script>

<template>
  <Card>
    <CardHeader title="Create Item">
      <template #actions>
        <Link to="/items" variant="text">Cancel</Link>
      </template>
    </CardHeader>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-5">
      <FormField label="Name" required>
        <Input v-model="name" required />
      </FormField>

      <FormField label="Description">
        <Textarea v-model="description" :rows="4" />
      </FormField>

      <StatusText v-if="error" variant="error">{{ error }}</StatusText>

      <Button type="submit" :disabled="loading">
        {{ loading ? 'Saving...' : 'Save' }}
      </Button>
    </form>
  </Card>
</template>
```

## Styling

All components use Tailwind CSS utility classes for styling. The color scheme follows:

- **Primary Blue**: `#2563eb` (blue-600)
- **Gray scales**: gray-200 through gray-900
- **Success Green**: `#047857` (green-700)
- **Error Red**: `#b91c1c` (red-700)

Border radius is consistently set to `0.5rem` (rounded-lg) or `0.75rem` (rounded-xl) for cards.

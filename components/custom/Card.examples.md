# Card Component - Premium Design System

## 🎨 Variantes Disponibles

### 1. **Elevated (Default)** - Con sombra y elevación
```tsx
<Card variant="elevated">
  Premium card with shadow depth
</Card>
```

### 2. **Outlined** - Solo borde
```tsx
<Card variant="outlined">
  Clean outlined card
</Card>
```

### 3. **Flat** - Sin borde ni sombra
```tsx
<Card variant="flat">
  Subtle flat background
</Card>
```

### 4. **Glass** - Efecto glassmorphism
```tsx
<Card variant="glass">
  Modern glass effect with blur
</Card>
```

---

## 📐 Padding Options

```tsx
<Card padding="none">  {/* Sin padding */}
<Card padding="sm">    {/* 12px */}
<Card padding="md">    {/* 16px - default */}
<Card padding="lg">    {/* 24px */}
<Card padding="xl">    {/* 32px */}
```

---

## ✨ Interactive States

```tsx
{/* Hover effect */}
<Card hoverable>
  Scales slightly on hover
</Card>

{/* Clickable with cursor pointer */}
<Card clickable onClick={() => console.log('clicked')}>
  Interactive card with enhanced hover
</Card>
```

---

## 🎯 Con Header y Footer

```tsx
<Card
  header={
    <Card.Header
      title="User Profile"
      subtitle="Manage your account settings"
      icon={<UserIcon className="w-5 h-5 text-blue-600" />}
      action={
        <Button size="sm">Edit</Button>
      }
    />
  }
  footer={
    <div className="flex justify-end gap-2">
      <Button variant="ghost">Cancel</Button>
      <Button>Save</Button>
    </div>
  }
>
  <p>Card content goes here</p>
</Card>
```

---

## 📦 Con Secciones Internas

```tsx
<Card padding="lg">
  <Card.Section
    title="Personal Information"
    subtitle="Update your personal details"
    icon={<UserIcon className="w-5 h-5 text-blue-600" />}
  >
    <FormFields />
  </Card.Section>
  
  <Card.Section
    title="Security"
    subtitle="Manage your password and 2FA"
    icon={<ShieldIcon className="w-5 h-5 text-purple-600" />}
  >
    <SecuritySettings />
  </Card.Section>
</Card>
```

---

## 🔲 Grid Layout Helper

```tsx
<Card.Grid cols={3}>
  <Card clickable>
    <h3>Card 1</h3>
  </Card>
  <Card clickable>
    <h3>Card 2</h3>
  </Card>
  <Card clickable>
    <h3>Card 3</h3>
  </Card>
</Card.Grid>
```

**Opciones de columnas:**
- `cols={1}` - 1 columna siempre
- `cols={2}` - 2 columnas en md+
- `cols={3}` - 2 en md, 3 en lg (default)
- `cols={4}` - 2 en md, 3 en lg, 4 en xl

---

## 🎨 Ejemplos Reales

### Dashboard Stats Card
```tsx
<Card variant="elevated" hoverable clickable>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">Total Users</p>
      <h3 className="text-3xl font-bold text-gray-900">1,234</h3>
    </div>
    <div className="p-3 bg-blue-50 rounded-xl">
      <UsersIcon className="w-6 h-6 text-blue-600" />
    </div>
  </div>
  <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
</Card>
```

### Form Card (ya implementado en RoleForm)
```tsx
<Card
  variant="elevated"
  padding="lg"
  header={
    <Card.Header
      title="Role Information"
      subtitle="Basic details for this role"
      icon={
        <div className="p-2 bg-blue-50 rounded-lg">
          <Users className="w-5 h-5 text-blue-700" />
        </div>
      }
    />
  }
>
  <FormFields />
</Card>
```

### List Item Card
```tsx
<Card variant="outlined" hoverable clickable>
  <div className="flex items-center gap-4">
    <Avatar src={user.avatar} />
    <div className="flex-1">
      <h4 className="font-semibold text-gray-900">{user.name}</h4>
      <p className="text-sm text-gray-600">{user.email}</p>
    </div>
    <Badge>{user.role}</Badge>
  </div>
</Card>
```

### Settings Panel Card
```tsx
<Card variant="elevated" padding="none">
  <div className="border-b border-gray-100 p-6 bg-gradient-to-b from-gray-50/50 to-transparent">
    <h2 className="text-xl font-bold text-gray-900">Settings</h2>
    <p className="text-sm text-gray-600 mt-1">Manage your preferences</p>
  </div>
  
  <div className="divide-y divide-gray-100">
    <SettingItem />
    <SettingItem />
    <SettingItem />
  </div>
</Card>
```

---

## 🚀 Best Practices

1. **Use `variant="elevated"` for main content cards**
2. **Use `variant="outlined"` for list items or nested cards**
3. **Use `variant="glass"` for overlays or hero sections**
4. **Always add `hoverable` to clickable cards**
5. **Use `Card.Header` for consistent headers**
6. **Use `padding="lg"` for forms, `padding="md"` for lists**
7. **Combine with `Card.Grid` for responsive layouts**

---

## 🎯 Migration from old code

### Before:
```tsx
<div className="bg-white rounded-xl border border-gray-200 p-6">
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 bg-blue-50 rounded-lg">
      <Icon />
    </div>
    <div>
      <h3>Title</h3>
      <p>Subtitle</p>
    </div>
  </div>
  <Content />
</div>
```

### After:
```tsx
<Card
  variant="elevated"
  padding="lg"
  header={
    <Card.Header
      title="Title"
      subtitle="Subtitle"
      icon={<div className="p-2 bg-blue-50 rounded-lg"><Icon /></div>}
    />
  }
>
  <Content />
</Card>
```

---

✨ **Enjoy your premium Card component!**

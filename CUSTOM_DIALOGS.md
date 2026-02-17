# 🎨 Кастомные диалоги - Документация

## ✅ Что было добавлено:

### 1. **ConfirmDialog** - Красивое подтверждение
Заменяет стандартный `window.confirm()` на красивое модальное окно.

#### Особенности:
- ✅ 4 типа: `warning`, `info`, `success`, `danger`
- ✅ Иконки для каждого типа
- ✅ Цветные кнопки
- ✅ Закрытие по ESC
- ✅ Анимации (fade in + scale)
- ✅ Backdrop blur эффект

#### Использование:
```typescript
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/ConfirmDialog';

function MyComponent() {
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete item?',
      message: 'This action cannot be undone',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      // Удаляем
    }
  };

  return (
    <>
      <button onClick={handleDelete}>Delete</button>
      
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
```

---

### 2. **Toast** - Уведомления
Заменяет стандартный `alert()` на красивые toast уведомления.

#### Особенности:
- ✅ 4 типа: `success`, `error`, `info`, `warning`
- ✅ Автоскрытие (настраиваемое)
- ✅ Иконки с цветами
- ✅ Кнопка закрытия
- ✅ Анимация slide-in
- ✅ Позиция: top-right

#### Использование:
```typescript
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

function MyComponent() {
  const { success, error, info, warning, toastState, hideToast } = useToast();

  const handleSave = () => {
    // ... сохранение
    success('Saved successfully!');
  };

  const handleError = () => {
    error('Something went wrong!', 5000); // 5 секунд
  };

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleError}>Error</button>
      
      <Toast
        isOpen={toastState.isOpen}
        message={toastState.message}
        type={toastState.type}
        duration={toastState.duration}
        onClose={hideToast}
      />
    </>
  );
}
```

---

## 📂 Новые файлы:

### Компоненты:
- `src/components/ConfirmDialog.tsx` - Модальное окно подтверждения
- `src/components/Toast.tsx` - Toast уведомления

### Хуки:
- `src/hooks/useConfirm.ts` - Хук для подтверждений
- `src/hooks/useToast.ts` - Хук для toast

---

## 🎯 Где используется:

### HomePage:
- ✅ **Delete collection** - ConfirmDialog (danger)
- ✅ **Collection created** - Toast (success)
- ✅ **Collection deleted** - Toast (success)

### ProfilePage:
- ✅ **Logout** - ConfirmDialog (warning)
- ✅ **Profile updated** - Toast (success)
- ✅ **Update error** - Toast (error)
- ✅ **Import success** - Toast (success)
- ✅ **Import error** - Toast (error)

---

## 🎨 Примеры использования:

### ConfirmDialog типы:

#### Warning (предупреждение):
```typescript
confirm({
  title: 'Are you sure?',
  message: 'This will logout you from the app',
  type: 'warning',
  confirmText: 'Logout',
  cancelText: 'Stay'
});
```
🟠 Оранжевая иконка AlertTriangle

#### Danger (опасность):
```typescript
confirm({
  title: 'Delete item?',
  message: 'This action cannot be undone',
  type: 'danger',
  confirmText: 'Delete',
  cancelText: 'Cancel'
});
```
🔴 Красная иконка XCircle

#### Info (информация):
```typescript
confirm({
  title: 'Update available',
  message: 'New version is ready to install',
  type: 'info',
  confirmText: 'Update',
  cancelText: 'Later'
});
```
🔵 Синяя иконка Info

#### Success (успех):
```typescript
confirm({
  title: 'All done!',
  message: 'Do you want to continue?',
  type: 'success',
  confirmText: 'Yes',
  cancelText: 'No'
});
```
🟢 Зеленая иконка CheckCircle

---

### Toast типы:

```typescript
// Успех
success('Profile updated!');

// Ошибка
error('Something went wrong!');

// Информация
info('New feature available');

// Предупреждение
warning('Low disk space');

// С кастомной длительностью
success('Saved!', 5000); // 5 секунд
```

---

## 🎭 Дизайн:

### ConfirmDialog:
- Размер: до 448px ширины
- Padding: 24px
- Иконка: 80x80px круг с цветным фоном
- Кнопки: полная ширина, gap 12px
- Закругления: 24px (rounded-3xl)
- Backdrop: black/50 + blur

### Toast:
- Позиция: fixed top-4 right-4
- Максимальная ширина: 400px
- Иконка: 20x20px
- Автоскрытие: 3000ms (по умолчанию)
- Анимация: slide-in справа

---

## 🚀 Преимущества:

### Вместо `window.confirm()`:
- ❌ Браузерное окно (некрасиво)
- ❌ Блокирует весь UI
- ❌ Не кастомизируется
- ❌ Не адаптивно

### С ConfirmDialog:
- ✅ Красивый дизайн
- ✅ Работает async/await
- ✅ Полностью кастомизируется
- ✅ Адаптивный
- ✅ С анимациями
- ✅ Темная тема

### Вместо `alert()`:
- ❌ Блокирует UI
- ❌ Требует OK кнопки
- ❌ Некрасиво
- ❌ Не автоскрывается

### С Toast:
- ✅ Не блокирует UI
- ✅ Автоскрывается
- ✅ Красивые цвета
- ✅ С иконками
- ✅ Анимации
- ✅ Темная тема

---

## 💡 Лучшие практики:

### Когда использовать ConfirmDialog:
- Удаление данных
- Logout
- Опасные действия
- Подтверждение изменений

### Когда использовать Toast:
- Успешное сохранение
- Ошибки валидации
- Информационные сообщения
- Быстрые уведомления

### Тип диалога:
- **danger** - удаление, опасные действия
- **warning** - logout, потеря данных
- **info** - информация, обновления
- **success** - подтверждение успеха

### Длительность Toast:
- **Успех**: 2-3 секунды
- **Ошибка**: 4-5 секунд (чтобы прочитать)
- **Информация**: 3-4 секунды
- **Важное**: 0 (не скрывать автоматически)

---

## 📱 Адаптивность:

Все компоненты полностью адаптивные:
- ✅ Работают на мобильных
- ✅ Работают на планшетах
- ✅ Работают на десктопе
- ✅ Поддержка touch событий
- ✅ Закрытие по ESC (десктоп)

---

## 🎊 Результат:

Теперь вместо:
```javascript
if (window.confirm('Delete?')) {
  // удалить
}
alert('Deleted!');
```

У вас:
```typescript
const confirmed = await confirm({
  title: 'Delete item?',
  message: 'This cannot be undone',
  type: 'danger'
});

if (confirmed) {
  // удалить
  success('Deleted successfully!');
}
```

**Намного красивее и профессиональнее!** 🎨✨

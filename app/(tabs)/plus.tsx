Here's the fixed version with the missing closing brackets. I've added the missing closing brace for the styles object and removed the duplicate style definitions:

```javascript
// [Previous code remains the same until the styles object]

const styles = StyleSheet.create({
  // [All previous style definitions remain the same until the last few items]
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#EE7518',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  modalButtonSecondary: {
    backgroundColor: '#E5E2E1',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  }
});
```
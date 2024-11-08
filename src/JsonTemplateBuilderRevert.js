import React, { useState, useCallback, useEffect } from 'react';
import { FaPlus, FaMinus, FaTrash, FaBars } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Utility function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Utility function to map HTML tag types to readable names
const getElementTypeName = (type) => {
  const typeNames = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    p: 'Paragraph',
    ul: 'Unordered List',
    ol: 'Ordered List',
    span: 'Span',
    strong: 'Strong',
    br: 'Line Break',
  };
  return typeNames[type] || type.toUpperCase();
};

// Element types enumeration
const ElementTypes = {
  HEADING1: 'h1',
  HEADING2: 'h2',
  HEADING3: 'h3',
  PARAGRAPH: 'p',
  UNORDERED_LIST: 'ul',
  ORDERED_LIST: 'ol',
  SPAN: 'span',
  STRONG: 'strong',
  BREAK: 'br',
};

// Default content for new elements
const defaultContent = {
  ul: [],
  ol: [],
  br: '',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  p: 'Paragraph text',
  strong: 'Bold text',
  span: 'Span text',
};

// Formatted Input Component with rich text controls
const FormattedInput = ({
  value,
  onChange,
  placeholder,
  onRemove,
  onAddNestedSpan,
  onRemoveNestedSpan,
  onAddDescription,
}) => {
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const handleSelect = (e) => {
    setSelection({
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    });
  };

  const insertTag = (tag) => {
    const { start, end } = selection;
    const before = value.substring(0, start);
    const selected = value.substring(start, end);
    const after = value.substring(end);
    const newValue = `${before}<${tag}>${selected}</${tag}>${after}`;
    onChange(newValue);
  };

  const insertVariable = () => {
    onChange(`${value} {{Group//Variable Name}}`);
  };

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelect}
        placeholder={placeholder}
        className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 h-16"
      />
      <div className="flex space-x-2">
        <button
          onClick={() => insertTag('strong')}
          className="p-2 border rounded hover:bg-gray-100"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => insertTag('em')}
          className="p-2 border rounded hover:bg-gray-100"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => onChange(value + '<br>')}
          className="p-2 border rounded hover:bg-gray-100"
        >
          BR
        </button>
        <button
          onClick={insertVariable}
          className="p-2 border rounded hover:bg-gray-100 text-green-600"
        >
          VAR
        </button>
        {onAddDescription && (
          <button
            onClick={onAddDescription}
            className="p-2 border rounded hover:bg-gray-100 text-green-600"
          >
            DESC
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-2 border rounded hover:bg-gray-100 text-red-600"
          >
            <FaTrash className="h-4 w-4" />
          </button>
        )}
        {onAddNestedSpan && (
          <button
            onClick={onAddNestedSpan}
            className="p-2 border rounded hover:bg-gray-100 text-purple-600"
          >
            <FaPlus className="h-4 w-4" />
          </button>
        )}
        {onRemoveNestedSpan && (
          <button
            onClick={onRemoveNestedSpan}
            className="p-2 border rounded hover:bg-gray-100 text-red-600"
          >
            <FaMinus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ListItem Component
const ListItem = ({
  item,
  index,
  elementId,
  modifyListItem,
  addNestedSpan,
  updateNestedSpan,
  removeNestedSpan,
}) => (
  <Draggable draggableId={item.id} index={index} type="LIST_ITEM">
    {(provided) => (
      <li
        ref={provided.innerRef}
        {...provided.draggableProps}
        className="mb-4 p-4 bg-gray-50 rounded-md"
      >
        <div className="flex items-start gap-2">
          <div {...provided.dragHandleProps} className="mt-2">
            <FaBars className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 space-y-4">
            <FormattedInput
              value={item.content}
              onChange={(value) => modifyListItem(elementId, item.id, 'content', value)}
              placeholder="List item content"
              onAddNestedSpan={() => addNestedSpan(elementId, item.id)}
            />
            <input
              value={item.description || ''}
              onChange={(e) =>
                modifyListItem(elementId, item.id, 'description', e.target.value)
              }
              placeholder="Item description"
              className="w-full p-2 text-sm border rounded"
            />
            {item.nestedSpans.map((span) => (
              <div key={span.id} className="ml-4 p-4 bg-gray-100 rounded">
                <FormattedInput
                  value={span.content}
                  onChange={(value) =>
                    updateNestedSpan(elementId, item.id, span.id, 'content', value)
                  }
                  placeholder="Nested span content"
                  onRemoveNestedSpan={() => removeNestedSpan(elementId, item.id, span.id)}
                />
                <input
                  value={span.description || ''}
                  onChange={(e) =>
                    updateNestedSpan(
                      elementId,
                      item.id,
                      span.id,
                      'description',
                      e.target.value
                    )
                  }
                  placeholder="Nested span description"
                  className="w-full mt-2 p-2 text-sm border rounded"
                />
              </div>
            ))}
            <button
              onClick={() => modifyListItem(elementId, item.id, 'remove')}
              className="text-red-600 hover:text-red-700"
            >
              <FaTrash className="h-5 w-5" />
            </button>
          </div>
        </div>
      </li>
    )}
  </Draggable>
);

// Element Component
const Element = ({
  element,
  index,
  updateElement,
  removeElement,
  modifyListItem,
  addNestedSpan,
  updateNestedSpan,
  removeNestedSpan,
  addChildElement,
  level = 0,
}) => {
  const [showDescription, setShowDescription] = useState(!!element.description);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <Draggable draggableId={element.id} index={index} type="ELEMENT">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`
            mb-6 p-6 border rounded-lg bg-white shadow-sm
            ${level > 0 ? 'ml-8 border-l-4 border-l-blue-200' : ''}
          `}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2" {...provided.dragHandleProps}>
              <FaBars className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold">{getElementTypeName(element.type)}</h3>
            </div>
            <button
              onClick={() => removeElement(element.id)}
              className="text-red-600 hover:text-red-700"
            >
              <FaTrash className="h-5 w-5" />
            </button>
          </div>

          {/* Element Content */}
          {['ul', 'ol'].includes(element.type) ? (
            <>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={element.isDynamic}
                  onChange={(e) => updateElement(element.id, { isDynamic: e.target.checked })}
                />
                <span className="text-sm text-gray-600">Dynamic List</span>
              </label>
              {!element.isDynamic && (
                <>
                  <textarea
                    value={element.description || ''}
                    onChange={(e) => updateElement(element.id, { description: e.target.value })}
                    placeholder="List Description"
                    className="w-full p-2 mb-4 border rounded"
                  />
                  <Droppable droppableId={`${element.id}-list`} type="LIST_ITEM">
                    {(droppableProvided) => (
                      <ul
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                        className="space-y-4"
                      >
                        {element.content.map((item, idx) => (
                          <ListItem
                            key={item.id}
                            item={item}
                            index={idx}
                            elementId={element.id}
                            modifyListItem={modifyListItem}
                            addNestedSpan={addNestedSpan}
                            updateNestedSpan={updateNestedSpan}
                            removeNestedSpan={removeNestedSpan}
                          />
                        ))}
                        {droppableProvided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                  <button
                    onClick={() => modifyListItem(element.id, null, 'add')}
                    className="mt-4 text-green-600 hover:text-green-700 flex items-center gap-1"
                  >
                    <FaPlus className="h-5 w-5" />
                    <span>Add Item</span>
                  </button>
                </>
              )}
            </>
          ) : element.type === 'br' ? (
            <hr className="my-4 border-t border-gray-300" />
          ) : (
            <>
              <FormattedInput
                value={element.content}
                onChange={(value) => updateElement(element.id, { content: value })}
                placeholder={`${getElementTypeName(element.type)} content`}
                onAddDescription={() => setShowDescription(!showDescription)}
              />
              {showDescription && (
                <textarea
                  value={element.description || ''}
                  onChange={(e) => updateElement(element.id, { description: e.target.value })}
                  placeholder="Description/Instructions for AI"
                  className="w-full mt-4 p-2 border rounded"
                />
              )}
            </>
          )}

          {/* Render child elements */}
          {element.children && element.children.length > 0 && (
            <Droppable droppableId={`${element.id}-children`} type="ELEMENT">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {element.children.map((childElement, childIndex) => (
                    <Element
                      key={childElement.id}
                      element={childElement}
                      index={childIndex}
                      updateElement={updateElement}
                      removeElement={removeElement}
                      modifyListItem={modifyListItem}
                      addNestedSpan={addNestedSpan}
                      updateNestedSpan={updateNestedSpan}
                      removeNestedSpan={removeNestedSpan}
                      addChildElement={addChildElement}
                      level={level + 1}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}

          {/* Plus button to add child elements */}
          <div className="mt-4">
            {showDropdown ? (
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    const type = e.target.value;
                    if (type) {
                      addChildElement(element.id, type);
                      e.target.value = '';
                      setShowDropdown(false);
                    }
                  }}
                  className="p-2 border rounded w-full"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select element type
                  </option>
                  {Object.entries(ElementTypes).map(([key, value]) => (
                    <option key={key} value={value}>
                      {getElementTypeName(value)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-2 border rounded hover:bg-gray-100 text-red-600"
                >
                  <FaMinus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDropdown(true)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <FaPlus className="h-5 w-5" />
                <span>Add Child Element</span>
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

// Sidebar Component
const AddElementSidebar = ({ addElement }) => (
  <div className="w-64 bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Add Elements</h2>
    <div className="space-y-2">
      {Object.entries(ElementTypes).map(([key, value]) => (
        <button
          key={key}
          onClick={() => addElement(value)}
          className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
        >
          {getElementTypeName(value)}
        </button>
      ))}
    </div>
  </div>
);

// Helper functions for handleDragEnd
const findElementById = (elements, id) => {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children) {
      const childResult = findElementById(el.children, id);
      if (childResult) return childResult;
    }
  }
  return null;
};

const removeElementById = (elements, id) => {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].id === id) {
      elements.splice(i, 1);
      return true;
    }
    if (elements[i].children) {
      const childResult = removeElementById(elements[i].children, id);
      if (childResult) return true;
    }
  }
  return false;
};

const insertElementAt = (elements, index, element) => {
  elements.splice(index, 0, element);
};

// Main Component
const JsonTemplateBuilder = () => {
  const [elements, setElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState('');
  const [jsonTextarea, setJsonTextarea] = useState('');

  useEffect(() => {
    const schema = JSON.stringify(convertToJsonSchema(), null, 2);
    setJsonSchema(schema);
    setJsonTextarea(schema);
  }, [elements]);

  const addElement = useCallback((type) => {
    setElements((prev) => [
      ...prev,
      {
        id: generateId(),
        type,
        content: ['ul', 'ol'].includes(type) ? [] : defaultContent[type] || '',
        description: null,
        isDynamic: false,
        listItemDescription: null,
        hasDescription: ['ul', 'ol'].includes(type),
        children: [],
        parentId: null,
      },
    ]);
  }, []);

  const addChildElement = useCallback((parentId, type) => {
    const updateElements = (elements) => {
      return elements.map((el) => {
        if (el.id === parentId) {
          const newChild = {
            id: generateId(),
            type,
            content: ['ul', 'ol'].includes(type) ? [] : defaultContent[type] || '',
            description: null,
            isDynamic: false,
            listItemDescription: null,
            hasDescription: ['ul', 'ol'].includes(type),
            children: [],
            parentId: parentId,
          };
          return {
            ...el,
            children: [...(el.children || []), newChild],
          };
        }
        if (el.children) {
          return { ...el, children: updateElements(el.children) };
        }
        return el;
      });
    };
    setElements((prev) => updateElements(prev));
  }, []);

  const removeElement = useCallback((id) => {
    const removeElementById = (elements, id) => {
      return elements
        .filter((el) => el.id !== id)
        .map((el) => {
          if (el.children) {
            return { ...el, children: removeElementById(el.children, id) };
          }
          return el;
        });
    };
    setElements((prevElements) => removeElementById(prevElements, id));
  }, []);

  const updateElement = useCallback((id, updates) => {
    const updateElementRecursively = (elements) => {
      return elements.map((el) => {
        if (el.id === id) {
          const updatedElement = { ...el, ...updates };
          if (['ul', 'ol'].includes(updatedElement.type) && updatedElement.isDynamic) {
            updatedElement.content = [];
          }
          return updatedElement;
        }
        if (el.children) {
          return { ...el, children: updateElementRecursively(el.children) };
        }
        return el;
      });
    };
    setElements((prev) => updateElementRecursively(prev));
  }, []);

  const modifyListItem = useCallback((elementId, itemId, action, value = '') => {
    const updateElements = (elements) => {
      return elements.map((el) => {
        if (el.id === elementId) {
          let newContent = Array.isArray(el.content) ? [...el.content] : [];

          switch (action) {
            case 'add':
              newContent.push({
                id: generateId(),
                content: '',
                description: null,
                nestedSpans: [],
              });
              break;
            case 'remove':
              newContent = newContent.filter((item) => item.id !== itemId);
              break;
            case 'removeContent':
              newContent = newContent.map((item) =>
                item.id === itemId ? { ...item, content: '' } : item
              );
              break;
            case 'content':
              newContent = newContent.map((item) =>
                item.id === itemId ? { ...item, content: value } : item
              );
              break;
            case 'description':
              newContent = newContent.map((item) =>
                item.id === itemId
                  ? { ...item, description: value.trim() === '' ? null : value }
                  : item
              );
              break;
            default:
              break;
          }

          return { ...el, content: newContent };
        }
        if (el.children) {
          return { ...el, children: updateElements(el.children) };
        }
        return el;
      });
    };
    setElements((prev) => updateElements(prev));
  }, []);

  const addNestedSpan = useCallback((elementId, itemId) => {
    const updateElements = (elements) => {
      return elements.map((el) => {
        if (el.id === elementId) {
          const newContent = el.content.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                nestedSpans: [
                  ...(item.nestedSpans || []),
                  { id: generateId(), content: '', description: null },
                ],
              };
            }
            return item;
          });
          return { ...el, content: newContent };
        }
        if (el.children) {
          return { ...el, children: updateElements(el.children) };
        }
        return el;
      });
    };
    setElements((prev) => updateElements(prev));
  }, []);

  const updateNestedSpan = useCallback((elementId, itemId, spanId, field, value) => {
    const updateElements = (elements) => {
      return elements.map((el) => {
        if (el.id === elementId) {
          const newContent = el.content.map((item) => {
            if (item.id === itemId) {
              const updatedSpans = item.nestedSpans.map((span) => {
                if (span.id === spanId) {
                  if (field === 'description') {
                    return { ...span, [field]: value.trim() === '' ? null : value };
                  }
                  return { ...span, [field]: value };
                }
                return span;
              });
              return { ...item, nestedSpans: updatedSpans };
            }
            return item;
          });
          return { ...el, content: newContent };
        }
        if (el.children) {
          return { ...el, children: updateElements(el.children) };
        }
        return el;
      });
    };
    setElements((prev) => updateElements(prev));
  }, []);

  const removeNestedSpan = useCallback((elementId, itemId, spanId) => {
    const updateElements = (elements) => {
      return elements.map((el) => {
        if (el.id === elementId) {
          const newContent = el.content.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                nestedSpans: item.nestedSpans.filter((span) => span.id !== spanId),
              };
            }
            return item;
          });
          return { ...el, content: newContent };
        }
        if (el.children) {
          return { ...el, children: updateElements(el.children) };
        }
        return el;
      });
    };
    setElements((prev) => updateElements(prev));
  }, []);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    setElements((prevElements) => {
      const newElements = [...prevElements];

      if (type === 'ELEMENT') {
        // Handle element drag and drop
        const draggedElement = findElementById(newElements, draggableId);

        if (!draggedElement) return newElements;

        // Remove the dragged element from its original location
        removeElementById(newElements, draggableId);

        if (destination.droppableId === 'elements') {
          // Moved to root level
          draggedElement.parentId = null;
          insertElementAt(newElements, destination.index, draggedElement);
        } else {
          // Moved into another element's children
          const parentElement = findElementById(
            newElements,
            destination.droppableId.replace('-children', '')
          );
          if (parentElement) {
            if (!parentElement.children) parentElement.children = [];
            draggedElement.parentId = parentElement.id;
            insertElementAt(parentElement.children, destination.index, draggedElement);
          }
        }
      } else if (type === 'LIST_ITEM') {
        // Handle list item drag and drop
        const sourceElement = findElementById(
          newElements,
          source.droppableId.replace('-list', '')
        );
        const destinationElement = findElementById(
          newElements,
          destination.droppableId.replace('-list', '')
        );

        if (!sourceElement || !destinationElement) return newElements;

        const [movedItem] = sourceElement.content.splice(source.index, 1);
        destinationElement.content.splice(destination.index, 0, movedItem);
      }

      return newElements;
    });
  };

  // Updated convertToJsonSchema function
  const convertToJsonSchema = useCallback(() => {
    const convertElement = (element) => {
      const baseProps = { tag: { enum: [element.type] } };

      if (element.type === 'br') {
        return { properties: baseProps };
      }

      let properties = {
        ...baseProps,
      };

      if (element.content && typeof element.content === 'string' && element.content.trim() !== '') {
        properties.content = { enum: [element.content] };
      } else if (element.description) {
        properties.content = { description: element.description };
      }

      if (['ul', 'ol'].includes(element.type)) {
        if (element.isDynamic) {
          properties.children = [
            {
              properties: {
                tag: { enum: ['li'] },
                content: element.listItemDescription
                  ? { description: element.listItemDescription }
                  : undefined,
                children: null,
              },
            },
          ];
        } else {
          properties.children = element.content.map((item) => ({
            properties: {
              tag: { enum: ['li'] },
              content:
                item.content.trim() !== ''
                  ? { enum: [item.content] }
                  : item.description
                  ? { description: item.description }
                  : undefined,
              children:
                item.nestedSpans.length > 0
                  ? item.nestedSpans.map((span) => ({
                      properties: {
                        tag: { enum: ['span'] },
                        content:
                          span.content.trim() !== ''
                            ? { enum: [span.content] }
                            : span.description
                            ? { description: span.description }
                            : undefined,
                      },
                    }))
                  : null,
            },
          }));
        }
      } else {
        if (element.children && element.children.length > 0) {
          properties.children = element.children.map(convertElement);
        } else {
          properties.children = null;
        }
      }

      return { properties };
    };

    return {
      schema: {
        description:
          'Ensure that only the required data fields specified in the template are generated...',
        properties: {
          tag: { enum: ['body'] },
          children: elements.filter((el) => !el.parentId).map(convertElement),
        },
      },
    };
  }, [elements]);

  const renderPreview = () => {
    const renderElement = (element) => {
      if (element.type === 'br') {
        return <hr key={element.id} className="my-4 border-t border-gray-300" />;
      }

      const Component = {
        h1: (props) => <h1 {...props} className="text-4xl font-bold mb-4" />,
        h2: (props) => <h2 {...props} className="text-3xl font-bold mb-3" />,
        h3: (props) => <h3 {...props} className="text-2xl font-bold mb-2" />,
        p: 'p',
        strong: 'strong',
        span: 'span',
        ul: (props) => <ul {...props} className="list-disc pl-6 mb-4" />,
        ol: (props) => <ol {...props} className="list-decimal pl-6 mb-4" />,
      }[element.type] || 'div';

      const content =
        typeof element.content === 'string'
          ? element.content || (element.description && <em>{element.description}</em>)
          : null;

      let childrenContent = null;
      if (element.children && element.children.length > 0) {
        childrenContent = element.children.map(renderElement);
      }

      if (['ul', 'ol'].includes(element.type)) {
        return (
          <div key={element.id} className="mb-4">
            {element.description && (
              <p className="text-gray-600 italic mb-2">{element.description}</p>
            )}
            <Component>
              {element.content.map((item) => (
                <li key={item.id} className="mb-2">
                  {item.content || (item.description && <em>{item.description}</em>)}
                  {item.nestedSpans.map((span) => (
                    <span key={span.id} className="ml-2">
                      {span.content || (span.description && <em>{span.description}</em>)}
                    </span>
                  ))}
                </li>
              ))}
            </Component>
          </div>
        );
      }

      return (
        <Component key={element.id}>
          {content}
          {childrenContent}
        </Component>
      );
    };

    return (
      <div className="space-y-4">
        {elements.filter((element) => !element.parentId).map(renderElement)}
      </div>
    );
  };

  // Updated updateTemplateFromJson function
  const updateTemplateFromJson = () => {
    try {
      const parsedJson = JSON.parse(jsonTextarea);

      const convertJsonToElements = (jsonElement) => {
        const elProps = jsonElement.properties;
        const type = elProps.tag.enum[0];

        const newElement = {
          id: generateId(),
          type: type,
          content: elProps.content?.enum ? elProps.content.enum[0] : '',
          description: elProps.content?.description || null,
          isDynamic: false,
          listItemDescription: null,
          hasDescription: ['ul', 'ol'].includes(type),
          children: [],
          parentId: null,
        };

        if (['ul', 'ol'].includes(type)) {
          if (elProps.children && elProps.children.length > 0) {
            newElement.content = elProps.children.map((child) => {
              const liProps = child.properties;
              const listItem = {
                id: generateId(),
                content: liProps.content?.enum ? liProps.content.enum[0] : '',
                description: liProps.content?.description || null,
                nestedSpans: [],
              };

              if (liProps.children && liProps.children.length > 0) {
                listItem.nestedSpans = liProps.children.map((span) => {
                  const spanProps = span.properties;
                  return {
                    id: generateId(),
                    content: spanProps.content?.enum ? spanProps.content.enum[0] : '',
                    description: spanProps.content?.description || null,
                  };
                });
              }

              return listItem;
            });
          } else if (elProps.children && elProps.children[0]?.properties?.content?.description) {
            newElement.isDynamic = true;
            newElement.listItemDescription = elProps.children[0].properties.content.description;
          }
        }

        if (elProps.children && !['ul', 'ol'].includes(type)) {
          newElement.children = elProps.children.map((child) => {
            const childElement = convertJsonToElements(child);
            childElement.parentId = newElement.id;
            return childElement;
          });
        }

        return newElement;
      };

      const newElements = parsedJson.schema.properties.children.map((child) => {
        const element = convertJsonToElements(child);
        element.parentId = null;
        return element;
      });

      setElements(newElements);
    } catch (error) {
      alert('Invalid JSON format.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder</h1>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-8">
            <AddElementSidebar addElement={addElement} />
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-6">Template Builder</h2>
                <Droppable droppableId="elements" type="ELEMENT">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {elements
                        .filter((element) => !element.parentId)
                        .map((element, index) => (
                          <Element
                            key={element.id}
                            element={element}
                            index={index}
                            updateElement={updateElement}
                            removeElement={removeElement}
                            modifyListItem={modifyListItem}
                            addNestedSpan={addNestedSpan}
                            updateNestedSpan={updateNestedSpan}
                            removeNestedSpan={removeNestedSpan}
                            addChildElement={addChildElement}
                          />
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-6">Preview</h2>
                {renderPreview()}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">JSON Schema</h2>
                <textarea
                  value={jsonTextarea}
                  onChange={(e) => setJsonTextarea(e.target.value)}
                  className="w-full h-[300px] font-mono text-sm p-4 border rounded mb-4"
                />
                <div className="flex justify-end">
                  <button
                    onClick={updateTemplateFromJson}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Update Template from JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default JsonTemplateBuilder;

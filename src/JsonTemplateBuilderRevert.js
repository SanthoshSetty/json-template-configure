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
  <li className="mb-4 p-4 bg-gray-50 rounded-md">
    <div className="flex items-start gap-2">
      <div className="mt-2">
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
          onChange={(e) => modifyListItem(elementId, item.id, 'description', e.target.value)}
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
                updateNestedSpan(elementId, item.id, span.id, 'description', e.target.value)
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

  return (
    <div
      className={`
        mb-6 p-6 border rounded-lg bg-white shadow-sm
        ${level > 0 ? 'ml-8 border-l-4 border-l-blue-200' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
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
              <ul className="space-y-4">
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
              </ul>
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
        <div className="mt-4">
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
        </div>
      )}

      {/* Dropdown to add child elements */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Child Element:
        </label>
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              const type = e.target.value;
              if (type) {
                addChildElement(element.id, type);
                e.target.value = '';
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
        </div>
      </div>
    </div>
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

// Main Component
const JsonTemplateBuilder = () => {
  const [elements, setElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState(
    JSON.stringify(
      {
        schema: {
          properties: {
            tag: { enum: ['body'] },
            children: [],
          },
        },
      },
      null,
      2
    )
  );

  useEffect(() => {
    setJsonSchema(JSON.stringify(convertToJsonSchema(), null, 2));
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

  const convertToJsonSchema = useCallback(() => {
    const convertElement = (element) => {
      const baseProps = { tag: { enum: [element.type] } };

      if (element.type === 'br') {
        return { properties: baseProps };
      }

      let schema = {
        properties: {
          ...baseProps,
          content:
            element.content && typeof element.content === 'string' && element.content.trim() !== ''
              ? { enum: [element.content] }
              : element.description
              ? { description: element.description }
              : undefined,
        },
      };

      if (['ul', 'ol'].includes(element.type)) {
        if (element.isDynamic) {
          schema.properties.children = [
            {
              type: 'array',
              items: {
                properties: {
                  tag: { enum: ['li'] },
                  content: element.listItemDescription
                    ? { description: element.listItemDescription }
                    : undefined,
                  children: null,
                },
              },
            },
          ];
        } else {
          schema.properties.children = element.content.map((item) => ({
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
          schema.properties.children = {
            type: 'array',
            items: element.children.map(convertElement),
          };
        } else {
          schema.properties.children = null;
        }
      }

      return schema;
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
        h1: 'h1',
        h2: 'h2',
        h3: 'h3',
        p: 'p',
        strong: 'strong',
        span: 'span',
        ul: 'ul',
        ol: 'ol',
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
            <Component className="pl-5 list-inside">
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
        <Component key={element.id} className="mb-4">
          {content}
          {childrenContent && <div className="pl-4">{childrenContent}</div>}
        </Component>
      );
    };

    return (
      <div className="space-y-4">
        {elements.filter((element) => !element.parentId).map(renderElement)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder</h1>
        <div className="flex gap-8">
          <AddElementSidebar addElement={addElement} />
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6">Template Builder</h2>
              <div>
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
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6">Preview</h2>
              {renderPreview()}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">JSON Schema</h2>
              <textarea
                value={jsonSchema}
                onChange={(e) => setJsonSchema(e.target.value)}
                className="w-full h-[300px] font-mono text-sm p-4 border rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonTemplateBuilder;

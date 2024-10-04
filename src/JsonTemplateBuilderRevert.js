import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon, MinusIcon, TrashIcon, VariableIcon } from '@heroicons/react/solid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

const getElementTypeName = (type) => {
  const typeNames = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    p: 'Paragraph',
    ul: 'Unordered List (Bullet Points)',
    ol: 'Ordered List (Numbered list)',
    span: 'Span (continuous text)',
    strong: 'Strong (Bold text)',
    br: 'Space'
  };
  return typeNames[type] || type.toUpperCase();
};

const ElementTypes = {
  HEADING1: 'h1',
  HEADING2: 'h2',
  HEADING3: 'h3',
  PARAGRAPH: 'p',
  UNORDERED_LIST: 'ul',
  ORDERED_LIST: 'ol',
  SPAN: 'span',
  STRONG: 'strong',
  BREAK: 'br'
};

const defaultContent = {
  ul: [{ id: uuidv4(), content: 'List item 1', description: '', nestedSpans: [] }],
  ol: [{ id: uuidv4(), content: 'List item 1', description: '', nestedSpans: [] }],
  br: '', 
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  p: 'Paragraph text',
  strong: 'Bold text',
  span: 'Span text'
};

const AddElementSidebar = ({ addElement }) => (
  <div className="w-full md:w-64 bg-white shadow-md rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Add Elements</h2>
    {Object.entries(ElementTypes).map(([key, value]) => (
      <button
        key={key}
        onClick={() => addElement(value)}
        className="block w-full mb-2 text-left text-blue-500 hover:text-blue-700 transition-colors duration-200"
      >
        Add {key.replace(/_/g, ' ')}
      </button>
    ))}
  </div>
);

const FormattedInput = ({ value, onChange, placeholder }) => {
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  const handleSelect = (e) => {
    setSelectionStart(e.target.selectionStart);
    setSelectionEnd(e.target.selectionEnd);
  };

  const insertTag = (tag) => {
    const before = value.substring(0, selectionStart);
    const selection = value.substring(selectionStart, selectionEnd);
    const after = value.substring(selectionEnd);
    const newValue = `${before}<${tag}>${selection}</${tag}>${after}`;
    onChange(newValue);
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelect}
        className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        placeholder={placeholder}
      />
      <div className="flex space-x-2 mb-2">
        <button onClick={() => insertTag('strong')} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Bold</button>
        <button onClick={() => insertTag('em')} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Italic</button>
        <button onClick={() => onChange(value + '<br>')} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Line Break</button>
      </div>
    </div>
  );
};

const ListItem = ({ item, index, elementId, modifyListItem, insertVariable, insertBreak, addNestedSpan, updateNestedSpan, removeNestedSpan }) => (
  <Draggable draggableId={item.id} index={index} key={item.id}>
    {(provided) => (
      <div
        className="mb-4 p-4 bg-gray-50 rounded-md"
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <div className="flex flex-col mb-2">
          <FormattedInput
            value={item.content}
            onChange={(value) => modifyListItem(elementId, item.id, 'content', value)}
            placeholder="List item content"
          />
          <input
            value={item.description}
            onChange={(e) => modifyListItem(elementId, item.id, 'description', e.target.value)}
            className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            placeholder="Item description"
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <button onClick={() => modifyListItem(elementId, item.id, 'removeContent')} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
            Remove Content
          </button>
          <button onClick={() => insertVariable(elementId, item.id)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
            Insert Variable
          </button>
          <button onClick={() => insertBreak(elementId, item.id)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
            Add Break
          </button>
          <button onClick={() => addNestedSpan(elementId, item.id)} className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600">
            Add Nested Span
          </button>
          <button
            onClick={() => modifyListItem(elementId, item.id, 'remove')}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Remove Item
          </button>
        </div>
        {item.nestedSpans.map((span, spanIdx) => (
          <div key={span.id} className="mt-2 ml-4 p-2 bg-gray-100 rounded">
            <FormattedInput
              value={span.content}
              onChange={(value) => updateNestedSpan(elementId, item.id, span.id, 'content', value)}
              placeholder="Nested span content"
            />
            <input
              value={span.description}
              onChange={(e) => updateNestedSpan(elementId, item.id, span.id, 'description', e.target.value)}
              className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
              placeholder="Nested span description"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <button onClick={() => removeNestedSpan(elementId, item.id, span.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
                Remove Span
              </button>
              <button onClick={() => insertVariable(elementId, item.id, span.id)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                Insert Variable
              </button>
              <button onClick={() => insertBreak(elementId, item.id, span.id)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                Add Break
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </Draggable>
);

const Element = ({
  element,
  index,
  updateElement,
  removeElement,
  modifyListItem,
  insertVariable,
  insertBreak,
  addNestedSpan,
  updateNestedSpan,
  removeNestedSpan
}) => (
  <Draggable draggableId={element.id} index={index} key={element.id}>
    {(provided) => (
      <div
        className="mb-6 p-6 border rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md"
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        <div className="flex justify-between items-center mb-4" {...provided.dragHandleProps}>
          <h3 className="text-lg font-semibold text-gray-700">{getElementTypeName(element.type)}</h3>
          <button onClick={() => removeElement(element.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
            Remove
          </button>
        </div>
        {element.type === 'br' ? (
          <p className="text-sm text-gray-500 italic">Line Break (No content)</p>
        ) : ['ul', 'ol'].includes(element.type) ? (
          <>
            <label className="flex items-center mb-4 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={element.isDynamic}
                onChange={(e) => updateElement(element.id, { isDynamic: e.target.checked })}
                className="mr-2"
              />
              <span>Dynamic List</span>
            </label>
            <textarea
              value={element.description}
              onChange={(e) => updateElement(element.id, { description: e.target.value })}
              placeholder="List Description"
              className="w-full p-2 mb-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {element.isDynamic ? (
              <textarea
                value={element.listItemDescription}
                onChange={(e) => updateElement(element.id, { listItemDescription: e.target.value })}
                placeholder="Item Description"
                className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <Droppable droppableId={element.id} type={`list-${element.id}`}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {element.content.map((item, idx) => (
                      <ListItem
                        key={item.id}
                        item={item}
                        index={idx}
                        elementId={element.id}
                        modifyListItem={modifyListItem}
                        insertVariable={insertVariable}
                        insertBreak={insertBreak}
                        addNestedSpan={addNestedSpan}
                        updateNestedSpan={updateNestedSpan}
                        removeNestedSpan={removeNestedSpan}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
            {!element.isDynamic && (
              <div className="mt-4">
                <button
                  onClick={() => modifyListItem(element.id, null, 'add')}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Item
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {!element.hasDescription ? (
              <FormattedInput
                value={element.content}
                onChange={(value) => updateElement(element.id, { content: value })}
                placeholder={`${getElementTypeName(element.type)} content`}
              />
            ) : (
              <p className="text-sm text-gray-500 italic">Content won't be used since a description is provided.</p>
            )}
            {element.hasDescription ? (
              <>
                <textarea
                  value={element.description}
                  onChange={(e) => updateElement(element.id, { description: e.target.value })}
                  placeholder="Description/Instructions for AI"
                  className="w-full p-2 mt-4 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {!['ul', 'ol'].includes(element.type) && (
                  <button
                    onClick={() => updateElement(element.id, { hasDescription: false, description: '' })}
                    className="mt-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Remove Description
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => updateElement(element.id, { hasDescription: true })}
                className="mt-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Description
              </button>
            )}
            {!['ul', 'ol', 'br'].includes(element.type) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => insertVariable(element.id)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                  Insert Variable
                </button>
                <button onClick={() => insertBreak(element.id)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                  Add Break
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )}
  </Draggable>
);

const Element = ({
  element,
  index,
  updateElement,
  removeElement,
  modifyListItem,
  insertVariable,
  insertBreak,
  addNestedSpan,
  updateNestedSpan,
  removeNestedSpan
}) => (
  <Draggable draggableId={element.id} index={index} key={element.id}>
    {(provided) => (
      <div
        className="mb-6 p-6 border rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md"
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        <div className="flex justify-between items-center mb-4" {...provided.dragHandleProps}>
          <h3 className="text-lg font-semibold text-gray-700">{getElementTypeName(element.type)}</h3>
          <button onClick={() => removeElement(element.id)} className="text-red-500 hover:text-red-700 transition-colors duration-200">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
        {element.type === 'br' ? (
          <p className="text-sm text-gray-500 italic">Line Break (No content)</p>
        ) : ['ul', 'ol'].includes(element.type) ? (
          <>
            <label className="flex items-center mb-4 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={element.isDynamic}
                onChange={(e) => updateElement(element.id, { isDynamic: e.target.checked })}
                className="mr-2"
              />
              <span>Dynamic List</span>
            </label>
            <textarea
              value={element.description}
              onChange={(e) => updateElement(element.id, { description: e.target.value })}
              placeholder="List Description"
              className="w-full p-2 mb-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {element.isDynamic ? (
              <textarea
                value={element.listItemDescription}
                onChange={(e) => updateElement(element.id, { listItemDescription: e.target.value })}
                placeholder="Item Description"
                className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <Droppable droppableId={element.id} type={`list-${element.id}`}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {element.content.map((item, idx) => (
                      <ListItem
                        key={item.id}
                        item={item}
                        index={idx}
                        elementId={element.id}
                        modifyListItem={modifyListItem}
                        insertVariable={insertVariable}
                        insertBreak={insertBreak}
                        addNestedSpan={addNestedSpan}
                        updateNestedSpan={updateNestedSpan}
                        removeNestedSpan={removeNestedSpan}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
            {!element.isDynamic && (
              <div className="mt-4">
                <button
                  onClick={() => modifyListItem(element.id, null, 'add')}
                  className="text-green-500 hover:text-green-700 transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 inline mr-1" />
                  Add Item
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {!element.hasDescription ? (
              <FormattedInput
                value={element.content}
                onChange={(value) => updateElement(element.id, { content: value })}
                placeholder={`${getElementTypeName(element.type)} content`}
              />
            ) : (
              <p className="text-sm text-gray-500 italic">Content won't be used since a description is provided.</p>
            )}
            {element.hasDescription ? (
              <>
                <textarea
                  value={element.description}
                  onChange={(e) => updateElement(element.id, { description: e.target.value })}
                  placeholder="Description/Instructions for AI"
                  className="w-full p-2 mt-4 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {!['ul', 'ol'].includes(element.type) && (
                  <button
                    onClick={() => updateElement(element.id, { hasDescription: false, description: '' })}
                    className="mt-2 text-blue-500 hover:text-blue-700 transition-colors duration-200"
                  >
                    Remove Description
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => updateElement(element.id, { hasDescription: true })}
                className="mt-2 text-blue-500 hover:text-blue-700 transition-colors duration-200"
              >
                Add Description
              </button>
            )}
            {!['ul', 'ol', 'br'].includes(element.type) && (
              <div className="mt-4">
                <button onClick={() => insertVariable(element.id)} className="text-blue-500 hover:text-blue-700 transition-colors duration-200 mr-2">
                  <VariableIcon className="h-5 w-5 inline mr-1" />
                  Insert Variable
                </button>
                <button onClick={() => insertBreak(element.id)} className="text-blue-500 hover:text-blue-700 transition-colors duration-200">
                  <VariableIcon className="h-5 w-5 inline mr-1" />
                  Add Break
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )}
  </Draggable>
);

const JsonTemplateBuilderRevert = () => {
  const [elements, setElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState(JSON.stringify({ schema: { properties: { tag: { enum: ['body'] }, children: [] } } }, null, 2));

  useEffect(() => {
    setJsonSchema(JSON.stringify(convertToJsonSchema(), null, 2));
  }, [elements]);

  const addElement = useCallback((type) => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        content: defaultContent[type] || 'New element',
        description: '',
        isDynamic: false,
        listItemDescription: '',
        hasDescription: false
      }
    ]);
  }, []);

  const removeElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  const updateElement = useCallback((id, updates) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id) {
          const updatedElement = { ...el, ...updates };
          if ('description' in updates && updates.description.trim() === '') updatedElement.hasDescription = false;
          return updatedElement;
        }
        return el;
      })
    );
  }, []);

  const modifyListItem = useCallback((elementId, itemId, action, value = '') => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === elementId) {
          let newContent = [...el.content];
          if (action === 'add') {
            newContent.push({ id: uuidv4(), content: '', description: '', nestedSpans: [] });
          } else if (action === 'remove') {
            newContent = newContent.filter(item => item.id !== itemId);
          } else if (action === 'removeContent') {
            newContent = newContent.map((item) => (item.id === itemId ? { ...item, content: '' } : item));
          } else if (action === 'content') {
            newContent = newContent.map((item) => (item.id === itemId ? { ...item, content: value } : item));
          } else if (action === 'description') {
            newContent = newContent.map((item) => (item.id === itemId ? { ...item, description: value } : item));
          } else if (action === 'removeSpan') {
            newContent = newContent.map((item) =>
              item.id === itemId
                ? { ...item, nestedSpans: item.nestedSpans.filter((span) => span.id !== value) }
                : item
            );
          }
          return { ...el, content: newContent };
        }
        return el;
      })
    );
  }, []);

  const addNestedSpan = useCallback((elementId, itemId) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === elementId) {
          const newContent = el.content.map((item) => {
            if (item.id === itemId) {
              return { ...item, nestedSpans: [...item.nestedSpans, { id: uuidv4(), content: '', description: '' }] };
            }
            return item;
          });
          return { ...el, content: newContent };
        }
        return el;
      })
    );
  }, []);

  const updateNestedSpan = useCallback((elementId, itemId, spanId, field, value) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === elementId) {
          const newContent = el.content.map((item) => {
            if (item.id === itemId) {
              const updatedSpans = item.nestedSpans.map((span) => (span.id === spanId ? { ...span, [field]: value } : span));
              return { ...item, nestedSpans: updatedSpans };
            }
            return item;
          });
          return { ...el, content: newContent };
        }
        return el;
      })
    );
  }, []);

  const removeNestedSpan = useCallback((elementId, itemId, spanId) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === elementId) {
          const newContent = el.content.map((item) => {
            if (item.id === itemId) {
              return { ...item, nestedSpans: item.nestedSpans.filter((span) => span.id !== spanId) };
            }
            return item;
          });
          return { ...el, content: newContent };
        }
        return el;
      })
    );
  }, []);

  const insertVariable = useCallback((id, itemId = null, spanId = null) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id) {
          if (itemId && spanId) {
            // Insert into nested span
            const newContent = el.content.map((item) => {
              if (item.id === itemId) {
                const updatedSpans = item.nestedSpans.map((span) =>
                  span.id === spanId ? { ...span, content: `${span.content} {{Group//Variable Name}}` } : span
                );
                return { ...item, nestedSpans: updatedSpans };
              }
              return item;
            });
            return { ...el, content: newContent };
          } else if (itemId) {
            // Insert into list item
            const newContent = el.content.map((item) =>
              item.id === itemId ? { ...item, content: `${item.content} {{Group//Variable Name}}` } : item
            );
            return { ...el, content: newContent };
          } else {
            // Insert into element content
            return { ...el, content: `${el.content} {{Group//Variable Name}}` };
          }
        }
        return el;
      })
    );
  }, []);

  const insertBreak = useCallback((id, itemId = null, spanId = null) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id) {
          if (itemId && spanId) {
            // Insert into nested span
            const newContent = el.content.map((item) => {
              if (item.id === itemId) {
                const updatedSpans = item.nestedSpans.map((span) =>
                  span.id === spanId ? { ...span, content: `${span.content}<br>` } : span
                );
                return { ...item, nestedSpans: updatedSpans };
              }
              return item;
            });
            return { ...el, content: newContent };
          } else if (itemId) {
            // Insert into list item
            const newContent = el.content.map((item) =>
              item.id === itemId ? { ...item, content: `${item.content}<br>` } : item
            );
            return { ...el, content: newContent };
          } else {
            // Insert into element content
            return { ...el, content: `${el.content}<br>` };
          }
        }
        return el;
      })
    );
  }, []);

  const handleDragEnd = (result) => {
    const { destination, source, type } = result;

    if (!destination) return;

    // Reorder elements
    if (type === 'ELEMENT') {
      const reorderedElements = Array.from(elements);
      const [movedElement] = reorderedElements.splice(source.index, 1);
      reorderedElements.splice(destination.index, 0, movedElement);
      setElements(reorderedElements);
    }

    // Reorder list items
    if (type.startsWith('list-')) {
      const elementId = type.split('-')[1];
      const reorderedElements = Array.from(elements);
      const elementIndex = reorderedElements.findIndex((el) => el.id === elementId);
      if (elementIndex === -1) return;
      const listItems = Array.from(reorderedElements[elementIndex].content);
      const [movedItem] = listItems.splice(source.index, 1);
      listItems.splice(destination.index, 0, movedItem);
      reorderedElements[elementIndex].content = listItems;
      setElements(reorderedElements);
    }
  };

  const convertToJsonSchema = () => ({
    schema: {
      properties: {
        tag: { enum: ['body'] },
        children: elements.map((element) => {
          const baseProps = { tag: { enum: [element.type] } };

          if (element.type === 'br') {
            return { properties: baseProps };
          }

          if (['ul', 'ol'].includes(element.type)) {
            if (element.isDynamic) {
              return {
                description: element.description || '',
                properties: {
                  ...baseProps,
                  children: [
                    {
                      type: 'array',
                      description: element.listItemDescription || '',
                      items: {
                        properties: {
                          tag: { enum: ['li'] },
                          children: null
                        }
                      }
                    }
                  ]
                }
              };
            } else {
              const listItems = element.content.map((item) => ({
                description: item.description || '',
                properties: {
                  tag: { enum: ['li'] },
                  ...(item.content ? { content: { enum: [item.content] } } : {}),
                  children:
                    item.nestedSpans.length > 0
                      ? item.nestedSpans.map((span) => ({
                          properties: {
                            tag: { enum: ['span'] },
                            ...(span.content ? { content: { enum: [span.content] } } : {}),
                            ...(span.description ? { description: span.description } : {})
                          }
                        }))
                      : null
                }
              }));
              return { description: element.description || '', properties: { ...baseProps, children: listItems } };
            }
          }

          const elementProps = {
            ...baseProps,
            content: element.hasDescription ? undefined : { enum: [element.content] },
            children: null
          };
          return element.hasDescription
            ? { description: element.description, properties: elementProps }
            : { properties: elementProps };
        })
      }
    }
  });

  const updateElementsFromSchema = () => {
    try {
      const parsedSchema = JSON.parse(jsonSchema);
      const newElements = parsedSchema.schema.properties.children.map((child) => {
        const type = child.properties.tag.enum[0];
        
        if (type === 'br') {
          return {
            id: uuidv4(),
            type,
            content: '',
            description: '',
            isDynamic: false,
            listItemDescription: '',
            hasDescription: false
          };
        }

        if (['ul', 'ol'].includes(type)) {
          if (child.properties.children && child.properties.children[0].type === 'array') {
            // Dynamic List
            const listItemDescription = child.properties.children[0].description || '';
            return {
              id: uuidv4(),
              type,
              content: [],
              description: child.description || '',
              isDynamic: true,
              listItemDescription,
              hasDescription: !!child.description
            };
          } else {
            // Static List
            const listItems = child.properties.children.map((item) => {
              const nestedSpans = item.properties.children
                ? item.properties.children.map((span) => ({
                    id: uuidv4(),
                    content: span.properties.content?.enum[0] || '',
                    description: span.description || ''
                  }))
                : [];
              return {
                id: uuidv4(),
                content: item.properties.content?.enum[0] || '',
                description: item.description || '',
                nestedSpans
              };
            });
            return {
              id: uuidv4(),
              type,
              content: listItems,
              description: child.description || '',
              isDynamic: false,
              listItemDescription: '',
              hasDescription: !!child.description
            };
          }
        }

        // Other Element Types
        return {
          id: uuidv4(),
          type,
          content: child.properties.content?.enum[0] || '',
          description: child.description || '',
          isDynamic: false,
          listItemDescription: '',
          hasDescription: !!child.description
        };
      });
      setElements(newElements);
    } catch (error) {
      console.error('Error parsing JSON schema:', error);
      alert('Invalid JSON schema. Please check your input.');
    }
  };

  const renderPreview = () => (
    <div className="p-5 bg-gray-100 rounded mb-5 text-gray-800">
      {elements.map((element, index) => {
        if (element.isDynamic && ['ul', 'ol'].includes(element.type)) {
          return (
            <div key={index} className="mb-4 p-3 bg-yellow-100 rounded">
              <p className="font-semibold">Dynamic {getElementTypeName(element.type)}:</p>
              <p className="italic">{element.description}</p>
              <p className="italic">Items: {element.listItemDescription}</p>
            </div>
          );
        }

        if (element.hasDescription) {
          return (
            <div key={index} className="mb-4 p-3 bg-green-100 rounded">
              <p className="font-semibold">{getElementTypeName(element.type)}:</p>
              <p className="italic">Generated content for: {element.description}</p>
            </div>
          );
        }

        switch (element.type) {
          case 'ul':
          case 'ol':
            const ListComponent = element.type === 'ul' ? 'ul' : 'ol';
            return (
              <ListComponent key={index} className={`mb-4 pl-5 ${element.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
                {element.content.map((item, idx) => (
                  <li key={idx} className="mb-2">
                    {item.nestedSpans.length > 0 ? (
                      item.nestedSpans.map((span, spanIdx) => (
                        <React.Fragment key={spanIdx}>
                          <span dangerouslySetInnerHTML={{ __html: span.content || (span.description && `<span class="italic text-gray-600">Generated content for: ${span.description}</span>`) }} />
                        </React.Fragment>
                      ))
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: item.content || (item.description && `<span class="italic text-gray-600">Generated content for: ${item.description}</span>`) }} />
                    )}
                  </li>
                ))}
              </ListComponent>
            );
          case 'br':
          return <hr key={index} className="my-4 border-t border-gray-300" />;
        case 'h1':
          return <h1 key={index} className="text-4xl font-bold mb-4" dangerouslySetInnerHTML={{ __html: element.content }} />;
        case 'h2':
          return <h2 key={index} className="text-3xl font-semibold mb-3" dangerouslySetInnerHTML={{ __html: element.content }} />;
        case 'h3':
          return <h3 key={index} className="text-2xl font-medium mb-2" dangerouslySetInnerHTML={{ __html: element.content }} />;
        case 'strong':
          return <strong key={index} className="font-bold" dangerouslySetInnerHTML={{ __html: element.content }} />;
        case 'span':
          return <span key={index} dangerouslySetInnerHTML={{ __html: element.content }} />;
        default:
          return <p key={index} className="mb-4" dangerouslySetInnerHTML={{ __html: element.content }} />;
      }
    })}
  </div>
);

return (
  <div className="font-sans p-8 bg-gray-100 min-h-screen">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder</h1>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:flex-row gap-8">
          <AddElementSidebar addElement={addElement} />
          <div className="flex-1">
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Template Builder</h2>
              <Droppable droppableId="elements" type="ELEMENT">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {elements.map((element, index) => (
                      <Element
                        key={element.id}
                        element={element}
                        index={index}
                        updateElement={updateElement}
                        removeElement={removeElement}
                        modifyListItem={modifyListItem}
                        insertVariable={insertVariable}
                        insertBreak={insertBreak}
                        addNestedSpan={addNestedSpan}
                        updateNestedSpan={updateNestedSpan}
                        removeNestedSpan={removeNestedSpan}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Human-Readable Preview</h2>
              {renderPreview()}
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">JSON Schema</h2>
              <textarea
                value={jsonSchema}
                onChange={(e) => setJsonSchema(e.target.value)}
                className="w-full h-[300px] p-2 font-mono text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={updateElementsFromSchema}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
              >
                Update Template
              </button>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  </div>
);
};

export default JsonTemplateBuilderRevert;
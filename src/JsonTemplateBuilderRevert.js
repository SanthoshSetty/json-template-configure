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
  ul: [{ id: uuidv4(), content: 'List item 1', description: null, nestedSpans: [] }],
  ol: [{ id: uuidv4(), content: 'List item 1', description: null, nestedSpans: [] }],
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

const FormattedInput = ({ value, onChange, placeholder, onRemove, onAddNestedSpan, onRemoveNestedSpan }) => {
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

  const insertBreak = () => {
    const newValue = `${value}<br>`;
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
        <button onClick={() => insertTag('strong')} className="p-1 text-blue-500 hover:text-blue-700">
          <span className="font-bold">B</span>
        </button>
        <button onClick={() => insertTag('em')} className="p-1 text-blue-500 hover:text-blue-700">
          <span className="italic">I</span>
        </button>
        <button onClick={insertBreak} className="p-1 text-blue-500 hover:text-blue-700">
          <span>BR</span>
        </button>
        <button onClick={() => onChange(value + ' {{Group//Variable Name}}')} className="p-1 text-green-500 hover:text-green-700">
          <VariableIcon className="h-5 w-5" />
        </button>
        {onRemove && (
          <button onClick={onRemove} className="p-1 text-red-500 hover:text-red-700">
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
        {onAddNestedSpan && (
          <button onClick={onAddNestedSpan} className="p-1 text-purple-500 hover:text-purple-700">
            <PlusIcon className="h-5 w-5" />
          </button>
        )}
        {onRemoveNestedSpan && (
          <button onClick={onRemoveNestedSpan} className="p-1 text-red-500 hover:text-red-700">
            <MinusIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const ListItem = ({ item, index, elementId, modifyListItem, insertVariable, addNestedSpan, updateNestedSpan, removeNestedSpan }) => (
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
            onRemove={() => modifyListItem(elementId, item.id, 'removeContent')}
            onAddNestedSpan={() => addNestedSpan(elementId, item.id)}
          />
          <input
            value={item.description || ''}
            onChange={(e) => modifyListItem(elementId, item.id, 'description', e.target.value)}
            className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            placeholder="Item description"
          />
        </div>
        {item.nestedSpans.map((span, spanIdx) => (
          <div key={span.id} className="mt-2 ml-4 p-2 bg-gray-100 rounded">
            <FormattedInput
              value={span.content}
              onChange={(value) => updateNestedSpan(elementId, item.id, span.id, 'content', value)}
              placeholder="Nested span content"
              onRemoveNestedSpan={() => removeNestedSpan(elementId, item.id, span.id)}
            />
            <input
              value={span.description || ''}
              onChange={(e) => updateNestedSpan(elementId, item.id, span.id, 'description', e.target.value)}
              className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
              placeholder="Nested span description"
            />
          </div>
        ))}
        <button
          onClick={() => modifyListItem(elementId, item.id, 'remove')}
          className="mt-2 p-1 text-red-500 hover:text-red-700"
        >
          <TrashIcon className="h-5 w-5" /> Remove Item
        </button>
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
          <button onClick={() => removeElement(element.id)} className="p-1 text-red-500 hover:text-red-700">
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
              value={element.description || ''}
              onChange={(e) => updateElement(element.id, { description: e.target.value })}
              placeholder="List Description"
              className="w-full p-2 mb-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {element.isDynamic ? (
              <textarea
                value={element.listItemDescription || ''}
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
                  className="p-1 text-green-500 hover:text-green-700"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <FormattedInput
              value={element.content}
              onChange={(value) => updateElement(element.id, { content: value })}
              placeholder={`${getElementTypeName(element.type)} content`}
            />
            <textarea
              value={element.description || ''}
              onChange={(e) => updateElement(element.id, { description: e.target.value })}
              placeholder="Description/Instructions for AI"
              className="w-full p-2 mt-4 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
        description: null,
        isDynamic: false,
        listItemDescription: null,
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
          if ('description' in updates) {
            updatedElement.description = updates.description.trim() === '' ? null : updates.description;
            updatedElement.hasDescription = updatedElement.description !== null;
          }
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
          newContent.push({ id: uuidv4(), content: '', description: null, nestedSpans: [] });
        } else if (action === 'remove') {
          newContent = newContent.filter(item => item.id !== itemId);
        } else if (action === 'removeContent') {
          newContent = newContent.map((item) => (item.id === itemId ? { ...item, content: '' } : item));
        } else if (action === 'content') {
          newContent = newContent.map((item) => (item.id === itemId ? { ...item, content: value } : item));
        } else if (action === 'description') {
          newContent = newContent.map((item) => (item.id === itemId ? { ...item, description: value.trim() === '' ? null : value } : item));
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
            return { ...item, nestedSpans: [...item.nestedSpans, { id: uuidv4(), content: '', description: null }] };
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
    description: "Ensure that the content produced strictly follows the given template, providing detailed and specific information without any summarization or commentary on the generated content. All required fields must be thoroughly completed, using the appropriate structure as specified in the template. You are not authorized to mention or reference the document, nor to provide any summary, commentary, or concluding remarks. The content should be presented clearly and concisely, maintaining a formal and neutral tone, with a focus solely on the required data and details",
    properties: {
      tag: { enum: ['body'] },
      children: elements.map((element) => {
        const baseProps = { tag: { enum: [element.type] } };
        const baseSchema = {
          ...(element.description ? { description: element.description } : {}),
          properties: { ...baseProps }
        };

        if (element.type === 'br') {
          return baseSchema;
        }

        if (['ul', 'ol'].includes(element.type)) {
          if (element.isDynamic) {
            return {
              ...baseSchema,
              properties: {
                ...baseProps,
                children: [
                  {
                    type: 'array',
                    ...(element.listItemDescription ? { description: element.listItemDescription } : {}),
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
              ...(item.description ? { description: item.description } : {}),
              properties: {
                tag: { enum: ['li'] },
                content: { enum: [item.content] },
                children: item.nestedSpans.length > 0
                  ? item.nestedSpans.map((span) => ({
                      ...(span.description ? { description: span.description } : {}),
                      properties: {
                        tag: { enum: ['span'] },
                        content: { enum: [span.content] }
                      }
                    }))
                  : null
              }
            }));
            return { ...baseSchema, properties: { ...baseProps, children: listItems } };
          }
        }

        const elementProps = {
          ...baseProps,
          content: element.hasDescription 
            ? { description: element.description }
            : { enum: [element.content] },
          children: null
        };
        return { ...baseSchema, properties: elementProps };
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
          description: child.description || null,
          isDynamic: false,
          listItemDescription: null,
          hasDescription: !!child.description
        };
      }

      if (['ul', 'ol'].includes(type)) {
        if (child.properties.children && child.properties.children[0].type === 'array') {
          // Dynamic List
          const listItemDescription = child.properties.children[0].description || null;
          return {
            id: uuidv4(),
            type,
            content: [],
            description: child.description || null,
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
                  content: span.properties.content.enum[0] || '',
                  description: span.description || null
                }))
              : [];
            return {
              id: uuidv4(),
              content: item.properties.content.enum[0] || '',
              description: item.description || null,
              nestedSpans
            };
          });
          return {
            id: uuidv4(),
            type,
            content: listItems,
            description: child.description || null,
            isDynamic: false,
            listItemDescription: null,
            hasDescription: !!child.description
          };
        }
      }

      // Other Element Types
      return {
        id: uuidv4(),
        type,
        content: child.properties.content?.enum?.[0] || '',
        description: child.description || child.properties.content?.description || null,
        isDynamic: false,
        listItemDescription: null,
        hasDescription: !!(child.description || child.properties.content?.description)
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
                        insertVariable={(id) => updateElement(id, { content: `${element.content} {{Group//Variable Name}}` })}
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
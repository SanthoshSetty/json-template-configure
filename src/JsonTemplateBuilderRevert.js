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

const defaultListDescription = "";

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
        {['ul', 'ol'].includes(element.type) && (
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
            {!element.isDynamic && (
              <textarea
                value={element.description || defaultListDescription}
                onChange={(e) => updateElement(element.id, { description: e.target.value })}
                className="w-full p-2 mb-4 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="List Description"
              />
            )}
          </>
        )}
        {element.type === 'br' ? (
          <p className="text-sm text-gray-500 italic">Line Break (No content)</p>
        ) : ['ul', 'ol'].includes(element.type) ? (
          <>
            {element.isDynamic ? (
              <textarea
                value={element.listItemDescription || ''}
                onChange={(e) => updateElement(element.id, { 
                  listItemDescription: e.target.value,
                  description: e.target.value // Copy to List Description
                })}
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
        description: ['ul', 'ol'].includes(type) ? defaultListDescription : null,
        isDynamic: false,
        listItemDescription: null,
        hasDescription: ['ul', 'ol'].includes(type)
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
          if (updatedElement.isDynamic && 'listItemDescription' in updates) {
            updatedElement.description = updates.listItemDescription;
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
    description: "Ensure that only the required data fields specified in the template are generated, strictly adhering to the provided element structure. Do not include any additional labels, headers, context, or text that falls outside the defined elements. Avoid generating any introductory text, section titles, or descriptive elements unless explicitly requested. Focus solely on the required data in the format provided, and ensure no content is generated outside the template's structural elements.Do not mention product name or any details about the product outside the ul,ol,p,span,strong elements",
    properties: {
      tag: { enum: ['body'] },
      children: elements.map((element) => {
        const baseProps = { tag: { enum: [element.type] } };
        let baseSchema = {};

        if (element.type === 'br') {
          return { properties: baseProps };
        }

        if (['ul', 'ol'].includes(element.type)) {
          // Set default list description above properties
          baseSchema = {
            description: "Follow instructions mentioned in list description",
            properties: { ...baseProps }
          };
          
          if (element.isDynamic) {
            baseSchema.properties.children = [
              {
                type: 'array',
                items: {
                  properties: {
                    tag: { enum: ['li'] },
                    content: element.listItemDescription ? { description: element.listItemDescription } : undefined,
                    children: null
                  }
                }
              }
            ];
          } else {
            baseSchema.properties.children = element.content.map((item) => ({
              properties: {
                tag: { enum: ['li'] },
                content: item.content.trim() !== '' 
                  ? { enum: [item.content] }
                  : (item.description ? { description: item.description } : undefined),
                children: item.nestedSpans.length > 0
                  ? item.nestedSpans.map((span) => ({
                      properties: {
                        tag: { enum: ['span'] },
                        content: span.content.trim() !== ''
                          ? { enum: [span.content] }
                          : (span.description ? { description: span.description } : undefined)
                      }
                    }))
                  : null
              }
            }));
          }
          return baseSchema;
        }

        // For non-ul and non-ol elements
        return {
          properties: {
            ...baseProps,
            content: element.content.trim() !== ''
              ? { enum: [element.content] }
              : (element.description ? { description: element.description } : undefined),
            children: null
          }
        };
      })
    }
  }
});

const updateElementsFromSchema = () => {
  try {
    console.log('Starting to update elements from schema');
    let parsedSchema;
    try {
      parsedSchema = JSON.parse(jsonSchema);
      console.log('Successfully parsed JSON schema:', parsedSchema);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      alert(`Invalid JSON format: ${parseError.message}`);
      return;
    }

    if (!parsedSchema.schema || !parsedSchema.schema.properties || !parsedSchema.schema.properties.children) {
      console.error('Invalid schema structure:', parsedSchema);
      throw new Error('Invalid schema structure. Expected schema.properties.children.');
    }

    const newElements = parsedSchema.schema.properties.children.map((child, index) => {
      console.log(`Processing child element at index ${index}:`, child);

      if (!child.properties || !child.properties.tag || !child.properties.tag.enum) {
        console.error(`Invalid element structure at index ${index}:`, child);
        throw new Error(`Invalid element structure at index ${index}. Expected properties.tag.enum.`);
      }

      const type = child.properties.tag.enum[0];
      console.log(`Element type: ${type}`);
      
      if (type === 'br') {
        return {
          id: uuidv4(),
          type,
          content: '',
          description: null,
          isDynamic: false,
          listItemDescription: null,
          hasDescription: false
        };
      }

      if (['ul', 'ol'].includes(type)) {
        console.log(`Processing list element of type ${type}`);
        const description = "Follow instructions mentioned in list description";
        if (child.properties.children && Array.isArray(child.properties.children)) {
          console.log('Processing static list');
          // Static List
          const listItems = child.properties.children.map((item, itemIndex) => {
            console.log(`Processing list item at index ${itemIndex}:`, item);
            if (!item.properties || !item.properties.tag || !item.properties.tag.enum) {
              console.error(`Invalid list item structure at element ${index}, item ${itemIndex}:`, item);
              throw new Error(`Invalid list item structure at element ${index}, item ${itemIndex}.`);
            }
            return {
              id: uuidv4(),
              content: item.properties.content?.enum?.[0] || '',
              description: item.properties.content?.description || null,
              nestedSpans: item.properties.children
                ? item.properties.children.map((span, spanIndex) => {
                    console.log(`Processing nested span at index ${spanIndex}:`, span);
                    if (!span.properties || !span.properties.tag || !span.properties.tag.enum) {
                      console.error(`Invalid nested span structure at element ${index}, item ${itemIndex}, span ${spanIndex}:`, span);
                      throw new Error(`Invalid nested span structure at element ${index}, item ${itemIndex}, span ${spanIndex}.`);
                    }
                    return {
                      id: uuidv4(),
                      content: span.properties.content?.enum?.[0] || '',
                      description: span.properties.content?.description || null
                    };
                  })
                : []
            };
          });
          return {
            id: uuidv4(),
            type,
            content: listItems,
            description,
            isDynamic: false,
            listItemDescription: null,
            hasDescription: true
          };
        } else if (child.properties.children && child.properties.children[0]?.type === 'array') {
          console.log('Processing dynamic list');
          // Dynamic List
          const listItemDescription = child.properties.children[0].items?.properties?.content?.description || null;
          return {
            id: uuidv4(),
            type,
            content: [],
            description,
            isDynamic: true,
            listItemDescription,
            hasDescription: true
          };
        } else {
          console.error(`Invalid list structure at index ${index}:`, child);
          throw new Error(`Invalid list structure at index ${index}. Expected children array or dynamic list.`);
        }
      }

      // Other Element Types
      console.log(`Processing other element type: ${type}`);
      return {
        id: uuidv4(),
        type,
        content: child.properties.content?.enum?.[0] || '',
        description: child.properties.content?.description || null,
        isDynamic: false,
        listItemDescription: null,
        hasDescription: !!child.properties.content?.description
      };
    });

    console.log('New elements created:', newElements);
    setElements(newElements);
    alert('Template updated successfully!');
  } catch (error) {
    console.error('Error updating elements from schema:', error);
    alert(`Error updating template: ${error.message}\nPlease check the console for more details.`);
  }
};

const renderPreview = () => (
  <div className="p-5 bg-gray-100 rounded mb-5 text-gray-800">
    {elements.map((element, index) => {
      if (['ul', 'ol'].includes(element.type)) {
        return (
          <div key={index} className="mb-4">
            <p className="italic text-gray-600 mb-2">List description: Follow instructions mentioned in list description</p>
            {element.isDynamic ? (
              <div className="p-3 bg-yellow-100 rounded">
                <p className="font-semibold">Dynamic {getElementTypeName(element.type)}:</p>
                <p className="italic">Items: {element.listItemDescription || 'No description provided'}</p>
              </div>
            ) : (
              <ListComponent
                type={element.type}
                items={element.content}
              />
            )}
          </div>
        );
      }

      if (element.type === 'br') {
        return <hr key={index} className="my-4 border-t border-gray-300" />;
      }

      const ElementComponent = getElementComponent(element.type);
      return (
        <ElementComponent key={index} className="mb-4">
          {element.content || (element.description && 
            <span className="italic text-gray-600">Generated content for: {element.description}</span>
          )}
        </ElementComponent>
      );
    })}
  </div>
);


const ListComponent = ({ type, items }) => {
  const ListTag = type === 'ul' ? 'ul' : 'ol';
  return (
    <ListTag className={`pl-5 ${type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
      {items.map((item, idx) => (
        <li key={idx} className="mb-2">
          {item.content || (item.description && 
            <span className="italic text-gray-600">Generated content for: {item.description}</span>
          )}
          {item.nestedSpans.length > 0 && (
            <span>
              {item.nestedSpans.map((span, spanIdx) => (
                <span key={spanIdx}>
                  {span.content || (span.description && 
                    <span className="italic text-gray-600">Generated content for: {span.description}</span>
                  )}
                </span>
              ))}
            </span>
          )}
        </li>
      ))}
    </ListTag>
  );
};

const getElementComponent = (type) => {
  switch (type) {
    case 'h1': return ({ children, className }) => <h1 className={`text-4xl font-bold ${className}`}>{children}</h1>;
    case 'h2': return ({ children, className }) => <h2 className={`text-3xl font-semibold ${className}`}>{children}</h2>;
    case 'h3': return ({ children, className }) => <h3 className={`text-2xl font-medium ${className}`}>{children}</h3>;
    case 'p': return ({ children, className }) => <p className={className}>{children}</p>;
    case 'strong': return ({ children, className }) => <strong className={`font-bold ${className}`}>{children}</strong>;
    case 'span': return ({ children, className }) => <span className={className}>{children}</span>;
    default: return ({ children, className }) => <div className={className}>{children}</div>;
  }
};

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
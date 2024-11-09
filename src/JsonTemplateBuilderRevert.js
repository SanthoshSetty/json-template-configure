import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon, MinusIcon, TrashIcon, VariableIcon, MenuIcon } from '@heroicons/react/solid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

/**
 * Utility function to map HTML tag types to readable names.
 */
const getElementTypeName = (type) => {
  const typeNames = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    p: 'Paragraph',
    ul: 'Unordered List (Bullet Points)',
    ol: 'Ordered List (Numbered List)',
    span: 'Span (Continuous Text)',
    strong: 'Strong (Bold Text)',
    br: 'Line Break'
  };
  return typeNames[type] || type.toUpperCase();
};

/**
 * Enumeration of supported element types.
 */
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

/**
 * Default content for each element type.
 */
const defaultContent = {
  ul: [{ id: uuidv4(), content: 'List item 1', description: null, nestedSpans: [] }],
  ol: [{ id: uuidv4(), content: 'List item 1', description: null, nestedSpans: [] }],
  br: '', 
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  p: 'Title', // Changed default for paragraph
  strong: 'Bold text',
  span: 'Span text'
};

/**
 * Helper function to parse and render HTML content in preview
 */
const renderFormattedContent = (content) => {
  if (!content) return null;
  
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = content;
  
  // Convert the HTML nodes to React elements
  const convertNode = (node) => {
    if (node.nodeType === 3) // Text node
      return node.textContent;
    
    if (node.nodeType !== 1) // Not an element node
      return null;
    
    const children = Array.from(node.childNodes).map(convertNode);
    
    switch (node.tagName.toLowerCase()) {
      case 'h1':
        return <h1 className="text-4xl font-bold">{children}</h1>;
      case 'h2':
        return <h2 className="text-3xl font-bold">{children}</h2>;
      case 'h3':
        return <h3 className="text-2xl font-bold">{children}</h3>;
      case 'strong':
        return <strong>{children}</strong>;
      case 'em':
        return <em>{children}</em>;
      default:
        return <>{children}</>;
    }
  };
  
  return Array.from(temp.childNodes).map((node, index) => 
    <React.Fragment key={index}>{convertNode(node)}</React.Fragment>
  );
};

/**
 * Component for formatted input with options like bold, italic, line break, and variables.
 */
const FormattedInput = ({ value, onChange, placeholder, onRemove, onAddNestedSpan, onRemoveNestedSpan, onAddDescription }) => {
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
        className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 h-16"
        placeholder={placeholder}
      />
      <div className="flex space-x-2 mb-2">
        <button onClick={() => insertTag('h1')} className="p-1 text-blue-500 hover:text-blue-700">
          <span className="text-lg font-bold">H1</span>
        </button>
        <button onClick={() => insertTag('h2')} className="p-1 text-blue-500 hover:text-blue-700">
          <span className="text-md font-bold">H2</span>
        </button>
        <button onClick={() => insertTag('h3')} className="p-1 text-blue-500 hover:text-blue-700">
          <span className="text-sm font-bold">H3</span>
        </button>
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
        {onAddDescription && (
          <button onClick={onAddDescription} className="p-1 text-green-500 hover:text-green-700">
            Add Description
          </button>
        )}
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

/**
 * Sidebar component to add new elements to the template.
 */
const AddElementSidebar = ({ addElement }) => {
  const visibleElements = {
    PARAGRAPH: 'p',
    UNORDERED_LIST: 'ul',
    ORDERED_LIST: 'ol',
    BREAK: 'br'
  };

  return (
    <div className="w-full md:w-64 bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Add Elements</h2>
      {Object.entries(visibleElements).map(([key, value]) => (
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
};

/**
 * Component representing a single element in the template.
 */
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
}) => {
  const [showDescription, setShowDescription] = useState(!!element.childDescription);

  useEffect(() => {
    if (element.childDescription) {
      setShowDescription(true);
    }
  }, [element.childDescription]);

  if (element.type === 'p') {
    return (
      <Draggable draggableId={element.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="mb-6 p-6 border rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="flex justify-between items-center mb-4" {...provided.dragHandleProps}>
              <h3 className="text-lg font-semibold text-gray-700">Paragraph</h3>
              <button onClick={() => removeElement(element.id)} className="p-1 text-red-500 hover:text-red-700">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Title (Parent paragraph) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <FormattedInput
                  value={element.content || ''}
                  onChange={(value) => updateElement(element.id, { content: value })}
                  placeholder="Enter title (supports H1/H2/H3, bold, italic)"
                />
              </div>
              
              {/* Content (Child paragraph) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <FormattedInput
                  value={element.childContent || ''}
                  onChange={(value) => updateElement(element.id, { childContent: value })}
                  placeholder="Enter content (supports H1/H2/H3, bold, italic)"
                  onAddDescription={() => setShowDescription(!showDescription)}
                />
              </div>
              
              {/* Description for child paragraph */}
              {showDescription && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (for AI)</label>
                  <textarea
                    value={element.childDescription || ''}
                    onChange={(e) => updateElement(element.id, { childDescription: e.target.value })}
                    className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-16"
                    placeholder="Enter description for AI-generated content"
                  />
                </div>
              )}

              {/* Preview */}
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                <div className="preview-content">
                  {renderFormattedContent(element.content)}
                  {renderFormattedContent(element.childContent)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  }

  // Original Element rendering for other types
  return (
    <Draggable draggableId={element.id} index={index}>
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
          {/* Rest of your original element rendering code */}
          {['ul', 'ol'].includes(element.type) && (
            // Your existing list rendering code
            // ... keep this part unchanged
          )}
          {element.type === 'br' ? (
            <hr className="my-4 border-t border-gray-300" />
          ) : !['ul', 'ol', 'br'].includes(element.type) && (
            // Your existing non-list element rendering code
            // ... keep this part unchanged
          )}
        </div>
      )}
    </Draggable>
  );
};


/**
 * Component representing an individual list item within a list.
 */
const ListItem = ({ item, index, elementId, modifyListItem, insertVariable, addNestedSpan, updateNestedSpan, removeNestedSpan }) => (
  <Draggable draggableId={item.id} index={index} key={item.id}>
    {(provided) => (
      <li
        className="mb-4 p-4 bg-gray-50 rounded-md flex items-start"
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        {/* Optional Drag Handle */}
        <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
          <MenuIcon className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex-1">
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
              className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 h-8"
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
                className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 h-8"
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
      </li>
    )}
  </Draggable>
);

/**
 * Modified schema conversion function
 */
const convertToJsonSchema = () => ({
  schema: {
    description: "Ensure that only the required data fields specified in the template are generated, strictly adhering to the provided element structure. Do not include any additional labels, headers, context, or text that falls outside the defined elements. Avoid generating any introductory text, section titles, or descriptive elements unless explicitly requested. Focus solely on the required data in the format provided, and ensure no content is generated outside the template's structural elements.Do not mention product name or any details about the product outside the ul,ol,p,span,strong elements",
    properties: {
      tag: { enum: ['body'] },
      children: elements.map((element) => {
        // Special handling for paragraphs with parent-child structure
        if (element.type === 'p') {
          return {
            properties: {
              tag: { enum: ['p'] },
              content: {
                enum: [element.content || '']
              },
              children: [
                {
                  properties: {
                    tag: { enum: ['p'] },
                    content: element.childContent ? 
                      { enum: [element.childContent] } : 
                      (element.childDescription ? { description: element.childDescription } : undefined),
                    children: null
                  }
                }
              ]
            }
          };
        }

        // Handle line breaks
        if (element.type === 'br') {
          return {
            properties: { tag: { enum: [element.type] } }
          };
        }

        // Handle lists
        if (['ul', 'ol'].includes(element.type)) {
          const baseSchema = element.description !== null 
            ? { description: element.description, properties: { tag: { enum: [element.type] } } }
            : { properties: { tag: { enum: [element.type] } } };
          
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

        // Handle other elements
        return {
          properties: {
            tag: { enum: [element.type] },
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

/**
 * Main component for building the JSON template with drag-and-drop functionality.
 */
const JsonTemplateBuilderRevert = () => {
  const [elements, setElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState(JSON.stringify({ schema: { properties: { tag: { enum: ['body'] }, children: [] } } }, null, 2));

  /**
   * Update the JSON schema whenever the elements state changes.
   */
  useEffect(() => {
    setJsonSchema(JSON.stringify(convertToJsonSchema(), null, 2));
  }, [elements]);

  /**
   * Adds a new element to the template.
   */
  const addElement = useCallback((type) => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        content: type === 'p' ? '' : defaultContent[type],
        childContent: type === 'p' ? '' : undefined,
        childDescription: null,
        description: ['ul', 'ol'].includes(type) ? "Follow the instructions mentioned in List description" : null,
        isDynamic: false,
        listItemDescription: null,
        hasDescription: ['ul', 'ol'].includes(type)
      }
    ]);
  }, []);

  /**
   * Removes an element from the template.
   */
  const removeElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  /**
   * Updates properties of a specific element.
   */
  const updateElement = useCallback((id, updates) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id) {
          const updatedElement = { ...el, ...updates };
          if (['ul', 'ol'].includes(updatedElement.type)) {
            if (updatedElement.isDynamic) {
              updatedElement.content = [];
            }
          }
          return updatedElement;
        }
        return el;
      })
    );
  }, []);

  /**
   * Modifies a list item within a specific list element.
   */
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

  /**
   * Handles the drag-and-drop events.
   */
  const handleDragEnd = (result) => {
    const { destination, source, type } = result;

    if (!destination) return;

    if (type === 'ELEMENT') {
      const reorderedElements = Array.from(elements);
      const [movedElement] = reorderedElements.splice(source.index, 1);
      reorderedElements.splice(destination.index, 0, movedElement);
      setElements(reorderedElements);
      return;
    }

    if (type === 'LIST') {
      const elementId = source.droppableId;
      setElements((prevElements) =>
        prevElements.map((element) => {
          if (element.id === elementId) {
            const reorderedItems = Array.from(element.content);
            const [movedItem] = reorderedItems.splice(source.index, 1);
            reorderedItems.splice(destination.index, 0, movedItem);
            return { ...element, content: reorderedItems };
          }
          return element;
        })
      );
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
              {/* Template Builder Section */}
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

              {/* JSON Schema Section */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">JSON Schema</h2>
                <textarea
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  className="w-full h-[300px] p-2 font-mono text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default JsonTemplateBuilderRevert;
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PlusIcon, TrashIcon, VariableIcon, MenuIcon } from '@heroicons/react/solid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

/**
 * Common formatting toolbar component
 */
const FormattingToolbar = ({ onFormatText, activeTextarea }) => {
  const insertTag = (tag) => {
    if (!activeTextarea) return;

    const start = activeTextarea.selectionStart;
    const end = activeTextarea.selectionEnd;
    const text = activeTextarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    const newValue = `${before}<${tag}>${selection}</${tag}>${after}`;
    
    onFormatText(newValue);

    // Restore focus to the textarea
    setTimeout(() => {
      activeTextarea.focus();
      activeTextarea.setSelectionRange(
        start + tag.length + 2,
        end + tag.length + 2
      );
    }, 0);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-sm text-gray-600 mb-2">Formatting Toolbar - Select text and click a format option to apply</div>
        <div className="flex space-x-2">
          <button 
            onClick={() => insertTag('h1')}
            className={`p-1 text-blue-500 hover:text-blue-700 ${!activeTextarea ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!activeTextarea}
          >
            <span className="text-lg font-bold">H1</span>
          </button>
          <button 
            onClick={() => insertTag('h2')}
            className={`p-1 text-blue-500 hover:text-blue-700 ${!activeTextarea ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!activeTextarea}
          >
            <span className="text-md font-bold">H2</span>
          </button>
          <button 
            onClick={() => insertTag('h3')}
            className={`p-1 text-blue-500 hover:text-blue-700 ${!activeTextarea ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!activeTextarea}
          >
            <span className="text-sm font-bold">H3</span>
          </button>
          <button 
            onClick={() => insertTag('strong')}
            className={`p-1 text-blue-500 hover:text-blue-700 ${!activeTextarea ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!activeTextarea}
          >
            <span className="font-bold">B</span>
          </button>
          <button 
            onClick={() => insertTag('em')}
            className={`p-1 text-blue-500 hover:text-blue-700 ${!activeTextarea ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!activeTextarea}
          >
            <span className="italic">I</span>
          </button>
          {activeTextarea && (
            <button 
              onClick={() => {
                const pos = activeTextarea.selectionStart;
                const text = activeTextarea.value;
                const newValue = `${text.substring(0, pos)} {{Group//Variable Name}}${text.substring(pos)}`;
                onFormatText(newValue);
              }}
              className="p-1 text-green-500 hover:text-green-700"
            >
              <VariableIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Component for formatted input
 */
const FormattedInput = ({ value, onChange, placeholder, onAddDescription, onFocus, fieldName, elementId, itemId }) => {
  const textareaRef = useRef(null);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => onFocus(textareaRef.current)}
        className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 h-16"
        placeholder={placeholder}
        data-field={fieldName}
        data-element-id={elementId}
        data-item-id={itemId}
      />
      {onAddDescription && (
        <button 
          onClick={onAddDescription} 
          className="absolute right-2 top-2 p-1 text-green-500 hover:text-green-700"
        >
          Add Description
        </button>
      )}
    </div>
  );
};

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
 * Helper function to parse and render HTML content in preview
 */
const renderFormattedContent = (content) => {
  if (!content) return null;
  
  const temp = document.createElement('div');
  temp.innerHTML = content;
  
  const convertNode = (node) => {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;
    
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
  onTextareaFocus
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
                  placeholder="Enter title"
                  onFocus={onTextareaFocus}
                  fieldName="content"
                  elementId={element.id}
                />
              </div>
              
              {/* Content (Child paragraph) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <FormattedInput
                  value={element.childContent || ''}
                  onChange={(value) => updateElement(element.id, { childContent: value })}
                  placeholder="Enter content"
                  onAddDescription={() => setShowDescription(!showDescription)}
                  onFocus={onTextareaFocus}
                  fieldName="childContent"
                  elementId={element.id}
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
            </div>
          </div>
        )}
      </Draggable>
    );
  }

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

          {['ul', 'ol'].includes(element.type) && (
            <>
              {/* Title Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <FormattedInput
                  value={element.content || ''}
                  onChange={(value) => updateElement(element.id, { content: value })}
                  placeholder="Enter title"
                  onFocus={onTextareaFocus}
                  fieldName="content"
                  elementId={element.id}
                />
              </div>

              <label className="flex items-center mb-4 text-sm text-gray-600 mt-4">
                <input
                  type="checkbox"
                  checked={element.isDynamic}
                  onChange={(e) => updateElement(element.id, { isDynamic: e.target.checked })}
                  className="mr-2"
                />
                <span>Dynamic List</span>
              </label>

              {element.isDynamic ? (
                <>
                  {/* Dynamic List Description Field */}
                  <FormattedInput
                    value={element.dynamicListDescription || ''}
                    onChange={(value) => updateElement(element.id, { dynamicListDescription: value })}
                    placeholder="Dynamic List Description"
                    onFocus={onTextareaFocus}
                    fieldName="dynamicListDescription"
                    elementId={element.id}
                  />
                </>
              ) : (
                <>
                  <Droppable droppableId={element.id} type="LIST">
                    {(provided) => {
                      const ListTag = element.type === 'ul' ? 'ul' : 'ol';
                      return (
                        <ListTag
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`pl-5 ${element.type === 'ul' ? 'list-disc' : 'list-decimal'}`}
                        >
                          {element.contentItems.map((item, idx) => (
                            <ListItem
                              key={item.id}
                              item={item}
                              index={idx}
                              elementId={element.id}
                              modifyListItem={modifyListItem}
                              onTextareaFocus={onTextareaFocus}
                            />
                          ))}
                          {provided.placeholder}
                        </ListTag>
                      );
                    }}
                  </Droppable>
                  <div className="mt-4">
                    <button
                      onClick={() => modifyListItem(element.id, null, 'add')}
                      className="flex items-center p-1 text-green-500 hover:text-green-700"
                    >
                      <PlusIcon className="h-5 w-5 mr-1" /> Add Item
                    </button>
                  </div>
                </>
              )}
            </>
          )}
          {element.type === 'br' ? (
            <hr className="my-4 border-t border-gray-300" />
          ) : !['ul', 'ol', 'br'].includes(element.type) && (
            <>
              <FormattedInput
                value={element.content}
                onChange={(value) => updateElement(element.id, { content: value })}
                placeholder={`${getElementTypeName(element.type)} content`}
                onFocus={onTextareaFocus}
                fieldName="content"
                elementId={element.id}
              />
            </>
          )}
        </div>
      )}
    </Draggable>
  );
};

/**
 * Component representing an individual list item within a list.
 */
const ListItem = ({ item, index, elementId, modifyListItem, onTextareaFocus }) => (
  <Draggable draggableId={item.id} index={index} key={item.id}>
    {(provided) => (
      <li
        className="mb-4 p-4 bg-gray-50 rounded-md flex items-start"
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
          <MenuIcon className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex-1">
          <div className="flex flex-col mb-2">
            <FormattedInput
              value={item.content}
              onChange={(value) => modifyListItem(elementId, item.id, 'content', value)}
              placeholder="List item content"
              onFocus={onTextareaFocus}
              fieldName="itemContent"
              elementId={elementId}
              itemId={item.id}
            />
            <FormattedInput
              value={item.description || ''}
              onChange={(value) => modifyListItem(elementId, item.id, 'description', value)}
              placeholder="Item description"
              onFocus={onTextareaFocus}
              fieldName="itemDescription"
              elementId={elementId}
              itemId={item.id}
            />
          </div>
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => modifyListItem(elementId, item.id, 'remove')}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <TrashIcon className="h-5 w-5" /> Remove Item
            </button>
          </div>
        </div>
      </li>
    )}
  </Draggable>
);

/**
 * Modified schema conversion function
 */
const convertToJsonSchema = (elements) => ({
  schema: {
    description:
      "Ensure that only the required data fields specified in the template are generated, strictly adhering to the provided element structure. Do not include any additional labels, headers, context, or text that falls outside the defined elements. Avoid generating any introductory text, section titles, or descriptive elements unless explicitly requested. Focus solely on the required data in the format provided, and ensure no content is generated outside the template's structural elements. Do not mention product name or any details about the product outside the ul, ol, p, span, strong elements.",
    properties: {
      tag: { enum: ['body'] },
      children: elements.map((element) => {
        // Handle paragraph elements
        if (element.type === 'p') {
          const hasTitle = element.content && element.content.trim() !== '';
          const hasContent = element.childContent && element.childContent.trim() !== '';
          const hasDescription = element.childDescription && element.childDescription.trim() !== '';

          // Parent paragraph with title
          const parentParagraph = {
            properties: {
              tag: { enum: ['p'] },
              content: hasTitle ? { enum: [element.content] } : undefined,
              children: null, // Initialize children as null
            },
          };

          // Child paragraph with content or description
          if (hasContent || hasDescription) {
            const childParagraph = {
              properties: {
                tag: { enum: ['p'] },
                content: hasContent
                  ? { enum: [element.childContent] }
                  : hasDescription
                  ? { description: element.childDescription }
                  : undefined,
                children: null, // Set children to null for child paragraph
              },
            };
            // Assign the child paragraph inside the parent's properties
            parentParagraph.properties.children = [childParagraph];
          }

          return parentParagraph;
        }

        // Handle line breaks
        if (element.type === 'br') {
          return {
            properties: {
              tag: { enum: [element.type] },
              children: null,
            },
          };
        }

        // Handle lists
        if (['ul', 'ol'].includes(element.type)) {
          const baseSchema = {
            properties: {
              tag: { enum: [element.type] },
              content: element.content ? { enum: [element.content] } : undefined,
              children: null, // Initialize children as null
            },
          };

          if (element.isDynamic) {
            baseSchema.properties.children = [
              {
                type: 'array',
                items: {
                  properties: {
                    tag: { enum: ['li'] },
                    content: element.dynamicListDescription
                      ? { description: element.dynamicListDescription }
                      : {},
                    children: null,
                  },
                },
              },
            ];
          } else if (element.contentItems.length > 0) {
            baseSchema.properties.children = element.contentItems.map((item) => ({
              properties: {
                tag: { enum: ['li'] },
                content:
                  item.content.trim() !== ''
                    ? { enum: [item.content] }
                    : item.description
                    ? { description: item.description }
                    : undefined,
                children: null,
              },
            }));
          }

          return baseSchema;
        }

        // Handle other elements
        return {
          properties: {
            tag: { enum: [element.type] },
            content:
              element.content && element.content.trim() !== ''
                ? { enum: [element.content] }
                : element.description
                ? { description: element.description }
                : undefined,
            children: null,
          },
        };
      }),
    },
  },
});


/**
 * Main component for building the JSON template with drag-and-drop functionality.
 */
const JsonTemplateBuilderRevert = () => {
  const [elements, setElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState(JSON.stringify({ schema: { properties: { tag: { enum: ['body'] }, children: [] } } }, null, 2));
  const [activeTextarea, setActiveTextarea] = useState(null);

  useEffect(() => {
    setJsonSchema(JSON.stringify(convertToJsonSchema(elements), null, 2));
  }, [elements]);

  const handleTextareaFocus = (textarea) => {
    setActiveTextarea(textarea);
  };

  const handleFormatText = (newValue) => {
    const elementId = activeTextarea?.dataset?.elementId;
    const fieldName = activeTextarea?.dataset?.field;
    const itemId = activeTextarea?.dataset?.itemId;
    
    if (!elementId || !fieldName) return;

    if (fieldName === 'content') {
      updateElement(elementId, { content: newValue });
    } else if (fieldName === 'childContent') {
      updateElement(elementId, { childContent: newValue });
    } else if (fieldName === 'dynamicListDescription') {
      updateElement(elementId, { dynamicListDescription: newValue });
    } else if (fieldName === 'itemContent' || fieldName === 'itemDescription') {
      if (!itemId) return;
      const actionType = fieldName === 'itemContent' ? 'content' : 'description';
      modifyListItem(elementId, itemId, actionType, newValue);
    }
  };

  const addElement = useCallback((type) => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        content: '',
        contentItems: ['ul', 'ol'].includes(type) ? [] : undefined,
        childContent: type === 'p' ? '' : undefined,
        childDescription: null,
        description: ['ul', 'ol'].includes(type) ? '' : null,
        isDynamic: ['ul', 'ol'].includes(type) ? true : false,
        dynamicListDescription: '',
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
          if (['ul', 'ol'].includes(updatedElement.type)) {
            if (updatedElement.isDynamic) {
              updatedElement.contentItems = [];
            }
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
          let newContentItems = [...el.contentItems];
          if (action === 'add') {
            newContentItems.push({ id: uuidv4(), content: '', description: '' });
          } else if (action === 'remove') {
            newContentItems = newContentItems.filter(item => item.id !== itemId);
          } else if (action === 'content' || action === 'description') {
            newContentItems = newContentItems.map((item) => (item.id === itemId ? { ...item, [action]: value } : item));
          }
          return { ...el, contentItems: newContentItems };
        }
        return el;
      })
    );
  }, []);

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
            const reorderedItems = Array.from(element.contentItems);
            const [movedItem] = reorderedItems.splice(source.index, 1);
            reorderedItems.splice(destination.index, 0, movedItem);
            return { ...element, contentItems: reorderedItems };
          }
          return element;
        })
      );
    }
  };

  const renderPreview = () => (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Preview</h2>
      <div className="space-y-4">
        {elements.map((element, index) => {
          if (element.type === 'p') {
            return (
              <div key={index} className="mb-6">
                <div className="font-semibold">
                  {renderFormattedContent(element.content)}
                </div>
                <div className="mt-2 ml-4">
                  {element.childContent ? (
                    renderFormattedContent(element.childContent)
                  ) : element.childDescription ? (
                    <span className="text-gray-600 italic">
                      Generated content for Prompt: "{element.childDescription}"
                    </span>
                  ) : null}
                </div>
              </div>
            );
          }

          if (element.type === 'br') {
            return <hr key={index} className="my-4 border-t border-gray-300" />;
          }

          if (['ul', 'ol'].includes(element.type)) {
            const ListTag = element.type === 'ul' ? 'ul' : 'ol';
            return (
              <div key={index} className="mb-6">
                {element.content && (
                  <div className="font-semibold">
                    {renderFormattedContent(element.content)}
                  </div>
                )}
                {element.isDynamic ? (
                  <div className="mt-2 ml-4">
                    <span className="text-gray-600 italic">
                      Generated dynamic list for Prompt: "{element.dynamicListDescription}"
                    </span>
                  </div>
                ) : (
                  <ListTag className={`pl-5 ${element.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
                    {element.contentItems.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        {item.content ? (
                          renderFormattedContent(item.content)
                        ) : item.description ? (
                          <span className="text-gray-600 italic">
                            Generated content for Prompt: "{item.description}"
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ListTag>
                )}
              </div>
            );
          }

          return (
            <div key={index}>
              {element.content ? (
                renderFormattedContent(element.content)
              ) : element.description ? (
                <span className="text-gray-600 italic">
                  Generated content for Prompt: "{element.description}"
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="font-sans p-8 pb-32 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder</h1>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:flex-row gap-8">
            <AddElementSidebar addElement={addElement} />
            <div className="flex-1">
              {/* Template Builder Section */}
              <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
                  Template Builder
                </h2>
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
                          onTextareaFocus={handleTextareaFocus}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Preview Section */}
              {renderPreview()}

              {/* JSON Schema Section */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
                  JSON Schema
                </h2>
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

      {/* Formatting Toolbar */}
      <FormattingToolbar
        onFormatText={handleFormatText}
        activeTextarea={activeTextarea}
      />
    </div>
  );
};

export default JsonTemplateBuilderRevert;

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

    setTimeout(() => {
      activeTextarea.focus();
      activeTextarea.setSelectionRange(
        start + tag.length + 2,
        end + tag.length + 2
      );
    }, 0);
  };

  const insertSelfClosingTag = (tag) => {
    if (!activeTextarea) return;

    const pos = activeTextarea.selectionStart;
    const text = activeTextarea.value;
    const before = text.substring(0, pos);
    const after = text.substring(pos);
    const newValue = `${before}<${tag}>${after}`;

    onFormatText(newValue);

    setTimeout(() => {
      activeTextarea.focus();
      activeTextarea.setSelectionRange(
        pos + tag.length + 2,
        pos + tag.length + 2
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
          <button 
            onClick={() => insertSelfClosingTag('br')}
            className={`p-1 text-blue-500 hover:text-blue-700 ${!activeTextarea ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!activeTextarea}
          >
            <span>BR</span>
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
    span: 'Span',
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
    if (node.nodeType === 3) {
      // Text node
      return node.textContent.replace(/\n/g, '<br/>').replace(/ /g, '\u00A0');
    }

    if (node.nodeType !== 1) return null;

    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(convertNode).filter(Boolean);
    const html = children.join('') || node.innerHTML || node.textContent;

    switch (tag) {
      case 'h1':
        return <h1 className="text-4xl font-bold" dangerouslySetInnerHTML={{ __html: html }} />;
      case 'h2':
        return <h2 className="text-3xl font-bold" dangerouslySetInnerHTML={{ __html: html }} />;
      case 'h3':
        return <h3 className="text-2xl font-bold" dangerouslySetInnerHTML={{ __html: html }} />;
      case 'strong':
        return <strong dangerouslySetInnerHTML={{ __html: html }} />;
      case 'em':
        return <em dangerouslySetInnerHTML={{ __html: html }} />;
      case 'span':
        return <span className="text-gray-800" dangerouslySetInnerHTML={{ __html: html }} />;
      case 'br':
        return <br />;
      default:
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    }
  };

  return Array.from(temp.childNodes).map((node, index) => (
    <React.Fragment key={index}>{convertNode(node)}</React.Fragment>
  ));
};


/**
 * Sidebar component to add new elements to the template.
 */
const AddElementSidebar = ({ addElement }) => {
  const visibleElements = {
    PARAGRAPH: 'p',
    UNORDERED_LIST: 'ul',
    ORDERED_LIST: 'ol',
    SPAN: 'span',
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
          ) : ['span', 'h1', 'h2', 'h3'].includes(element.type) ? (
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
const convertToJsonSchema = (elements) => {
  const sanitizeContent = (content) => {
    if (!content) return "";
    return content; // Return content as-is, preserving all spaces
  };

  if (!elements || elements.length === 0) {
    return {
      schema: {
        description: "Ensure that only the required data fields specified in the template are generated, strictly adhering to the provided element structure.",
        properties: {
          tag: { enum: ["body"] },
          content: null,
          children: []
        }
      }
    };
  }

  return {
    schema: {
      description: "Ensure that only the required data fields specified in the template are generated, strictly adhering to the provided element structure.",
      properties: {
        tag: { enum: ["body"] },
        content: null,
        children: elements.flatMap((element, index) => {
          const groupId = `group${index + 1}`;
          const groupElements = [];

          const createAttributes = (isTitle = false) => [{
            properties: {
              name: { enum: [isTitle ? "data-related-id" : "id"] },
              value: { enum: [groupId] }
            }
          }];

          if (element.type === 'p') {
            // Title as div with data-related-id
            if (element.content) {
              const sanitizedContent = sanitizeContent(element.content);
              if (sanitizedContent) {
                groupElements.push({
                  properties: {
                    tag: { enum: ["div"] },
                    attributes: createAttributes(true),
                    content: { enum: [sanitizedContent] },
                    children: null,
                  },
                });
              }
            }

            // Content as div with id
            if (element.childContent) {
              const sanitizedChildContent = sanitizeContent(element.childContent);
              if (sanitizedChildContent) {
                groupElements.push({
                  properties: {
                    tag: { enum: ["div"] },
                    attributes: createAttributes(),
                    content: { enum: [sanitizedChildContent] },
                    children: null,
                  },
                });
              }
            }

            // Description as div with id (for AI prompts)
            if (element.childDescription) {
              const sanitizedChildDesc = sanitizeContent(element.childDescription);
              if (sanitizedChildDesc) {
                groupElements.push({
                  properties: {
                    tag: { enum: ["div"] },
                    attributes: createAttributes(),
                    content: { description: sanitizedChildDesc },
                    children: null,
                  },
                });
              }
            }
          } else if (['ul', 'ol'].includes(element.type)) {
            // Handle lists
            if (element.content) {
              const sanitizedContent = sanitizeContent(element.content);
              if (sanitizedContent) {
                groupElements.push({
                  properties: {
                    tag: { enum: ["div"] },
                    attributes: createAttributes(true),
                    content: { enum: [sanitizedContent] },
                    children: null,
                  },
                });
              }
            }
            groupElements.push({
              description: "Follow the instructions mentioned in List description",
              properties: {
                tag: { enum: [element.type] },
                attributes: createAttributes(),
                content: null,
                children: element.isDynamic
                  ? [{
                      type: "array",
                      items: {
                        properties: {
                          tag: { enum: ["li"] },
                          attributes: createAttributes(),
                          content: { description: sanitizeContent(element.dynamicListDescription) },
                          children: null,
                        },
                      },
                    }]
                  : element.contentItems.map(item => ({
                      properties: {
                        tag: { enum: ["li"] },
                        attributes: createAttributes(),
                        content: item.description 
                          ? { description: sanitizeContent(item.description) }
                          : { enum: [sanitizeContent(item.content)] },
                        children: null,
                      }
                    }))
              }
            });
          } else if (element.type === 'br') {
            groupElements.push({
              properties: {
                tag: { enum: ["br"] },
                attributes: createAttributes(),
                content: null,
                children: null,
              },
            });
          } else if (['h1', 'h2', 'h3', 'span'].includes(element.type)) {
            // Span and headings use only content, no description
            const sanitizedContent = sanitizeContent(element.content);
            if (sanitizedContent) {
              groupElements.push({
                properties: {
                  tag: { enum: [element.type] },
                  attributes: createAttributes(),
                  content: { enum: [sanitizedContent] },
                  children: null,
                },
              });
            }
          }

          return groupElements;
        }),
      },
    },
  };
};

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
        childDescription: type === 'p' ? '' : null,
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
          } else if (action === 'content' || action == 'description') {
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

  const handleUpdateTemplate = () => {
    try {
      const parsedSchema = JSON.parse(jsonSchema);
      const newElements = parseJsonSchemaToElements(parsedSchema);
      setElements(newElements);
    } catch (error) {
      console.error('Failed to parse JSON schema:', error);
      alert(`Failed to parse JSON schema: ${error.message}`);
    }
  };

  const parseJsonSchemaToElements = (schema) => {
  console.log('Input schema:', JSON.stringify(schema, null, 2));
  if (!schema?.schema?.properties?.children) {
    console.warn('Invalid schema structure, returning empty elements');
    return [];
  }

  const groupedElements = {};
  const bodyChildren = schema.schema.properties.children || [];

  const extractContent = (contentObj) => {
    console.log('Extracting content from:', JSON.stringify(contentObj, null, 2));
    if (!contentObj) return '';
    if (typeof contentObj === 'string') return contentObj;
    if (Array.isArray(contentObj)) return ''; // Handle empty or invalid arrays
    if (contentObj.enum && Array.isArray(contentObj.enum) && contentObj.enum.length > 0) {
      return contentObj.enum[0];
    }
    if (contentObj.description) return contentObj.description;
    if (contentObj.value) return contentObj.value;
    if (contentObj.text) return contentObj.text;
    if (contentObj.content) return contentObj.content; // Handle nested content field
    // Fallback: extract any string from object
    if (typeof contentObj === 'object') {
      const stringValue = Object.values(contentObj).find(val => typeof val === 'string');
      if (stringValue) return stringValue;
      // Recursively search nested objects
      for (const key in contentObj) {
        if (typeof contentObj[key] === 'object' && contentObj[key] !== null) {
          const nestedContent = extractContent(contentObj[key]);
          if (nestedContent) return nestedContent;
        }
      }
    }
    console.warn('No valid content found in:', JSON.stringify(contentObj, null, 2));
    return '';
  };

  bodyChildren.forEach((child, index) => {
    const tag = child.properties?.tag?.enum?.[0]?.toLowerCase();
    if (!tag) {
      console.warn(`Child at index ${index} has no valid tag`, child);
      return;
    }

    const groupId = child.properties?.attributes?.[0]?.properties?.value?.enum?.[0] || `standalone_${tag}_${index}`;
    if (!groupedElements[groupId]) {
      groupedElements[groupId] = [];
    }
    groupedElements[groupId].push(child);
  });

  return Object.values(groupedElements).map((group, groupIndex) => {
    // Log the entire group for debugging
    console.log(`Processing group ${groupIndex}:`, JSON.stringify(group, null, 2));

    // Handle standalone span, h1, h2, h3
    const standaloneElement = group.find(el => {
      const tag = el.properties?.tag?.enum?.[0]?.toLowerCase();
      return ['span', 'h1', 'h2', 'h3'].includes(tag);
    });

    if (standaloneElement) {
      const tag = standaloneElement.properties.tag.enum[0].toLowerCase();
      const content = extractContent(standaloneElement.properties?.content);
      console.log(`Processing standalone ${tag} (group ${groupIndex}):`, { content });

      // Only create span element if content is non-empty or explicitly allowed
      if (content || tag !== 'span') {
        return {
          id: uuidv4(),
          type: tag,
          content,
          contentItems: [],
          childContent: null,
          childDescription: null,
          description: null,
          isDynamic: false,
          dynamicListDescription: '',
          hasDescription: false
        };
      }
      console.warn(`Skipping ${tag} with no content in group ${groupIndex}`);
      return null;
    }

    // Handle grouped elements (p, ul, ol)
    const mainElement = group.find(el =>
      el.properties?.attributes?.[0]?.properties?.name?.enum?.[0] === 'id'
    );
    const titleElement = group.find(el =>
      el.properties?.attributes?.[0]?.properties?.name?.enum?.[0] === 'data-related-id'
    );

    if (!mainElement) {
      console.warn(`No main element found for group ${groupIndex}:`, group);
      return null;
    }

    const tag = mainElement.properties.tag.enum[0].toLowerCase();
    const element = {
      id: uuidv4(),
      type: tag,
      content: extractContent(titleElement?.properties?.content),
      contentItems: [],
      childContent: '',
      childDescription: '',
      description: '',
      isDynamic: false,
      dynamicListDescription: '',
      hasDescription: false
    };

    if (['ul', 'ol'].includes(tag)) {
      const children = mainElement.properties.children;
      if (children?.[0]?.type === 'array') {
        element.isDynamic = true;
        element.dynamicListDescription = extractContent(children[0].items?.properties?.content);
      } else {
        element.isDynamic = false;
        element.contentItems = (children || []).map(item => ({
          id: uuidv4(),
          content: extractContent(item.properties?.content),
          description: extractContent(item.properties?.content?.description || '')
        }));
      }
    } else if (tag === 'div') {
      element.type = 'p';
      element.childContent = extractContent(mainElement.properties?.content);
      const descriptionElement = group.find(el =>
        el.properties?.tag?.enum?.[0]?.toLowerCase() === 'div' &&
        el.properties?.content?.description
      );
      if (descriptionElement) {
        element.childDescription = extractContent(descriptionElement.properties?.content);
      }
    }

    console.log(`Created element for ${tag} (group ${groupIndex}):`, element);
    return element;
  }).filter(Boolean);
};

 const renderPreview = () => (
  <div className="bg-white shadow-md rounded-lg p-6 mb-8">
    <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Preview</h2>
    <div className="space-y-2">
      {elements.map((element, index) => {
        if (element.type === 'p') {
          return (
            <div key={index} className="mb-4">
              {element.content && (
                <div className="font-semibold text-lg">
                  {renderFormattedContent(element.content)}
                </div>
              )}
              {(element.childContent || element.childDescription) && (
                <div className="mt-1 ml-4 text-gray-700">
                  {element.childContent ? (
                    renderFormattedContent(element.childContent)
                  ) : (
                    <span className="text-gray-600 italic">
                      Generated content for Prompt: "{element.childDescription}"
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        }

        if (element.type === 'br') {
          return <hr key={index} className="my-2 border-gray-300" />;
        }

        if (['ul', 'ol'].includes(element.type)) {
          const ListTag = element.type;
          return (
            <div key={index} className="mb-4">
              {element.content && (
                <div className="font-semibold text-lg">
                  {renderFormattedContent(element.content)}
                </div>
              )}
              <div className="mt-1">
                {element.isDynamic ? (
                  <div className="ml-4 text-gray-600 italic">
                    Generated dynamic list for Prompt: "{element.dynamicListDescription}"
                  </div>
                ) : (
                  <ListTag className={`pl-6 ${element.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
                    {element.contentItems.map((item, itemIndex) => (
                      <li key={itemIndex} className="mb-1">
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
            </div>
          );
        }

        if (element.type === 'span') {
          return (
            <span key={index} className="inline text-gray-700">
              {element.content ? renderFormattedContent(element.content) : null}
            </span>
          );
        }

        if (['h1', 'h2', 'h3'].includes(element.type)) {
          const Tag = element.type;
          return (
            <Tag key={index} className={`mb-2 ${element.type === 'h1' ? 'text-3xl' : element.type === 'h2' ? 'text-2xl' : 'text-xl'} font-bold`}>
              {element.content ? renderFormattedContent(element.content) : null}
            </Tag>
          );
        }

        return null;
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

              {renderPreview()}

              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
                  JSON Schema
                </h2>
                <textarea
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  className="w-full h-[300px] p-2 font-mono text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleUpdateTemplate}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Update Template
                </button>
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>

      <FormattingToolbar
        onFormatText={handleFormatText}
        activeTextarea={activeTextarea}
      />
    </div>
  );
};

export default JsonTemplateBuilderRevert;
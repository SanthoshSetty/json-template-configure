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
  p: 'Paragraph text',
  strong: 'Bold text',
  span: 'Span text'
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
  removeNestedSpan,
  addNestedElement,
  level = 0
}) => {
  const [showDescription, setShowDescription] = useState(!!element.description);
  const [showAddChild, setShowAddChild] = useState(false);

  const toggleDescription = () => {
    if (!element.description) {
      updateElement(element.id, { description: '' });
    }
    setShowDescription(!showDescription);
  };

  useEffect(() => {
    if (element.description) {
      setShowDescription(true);
    }
  }, [element.description]);

  const handleAddChild = (type) => {
    addNestedElement(element.id, type);
    setShowAddChild(false);
  };

  return (
    <Draggable draggableId={element.id} index={index} key={element.id}>
      {(provided) => (
        <div
          className="mb-6 p-6 border rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md"
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            marginLeft: `${level * 2}rem`,
            ...provided.draggableProps.style
          }}
        >
          <div className="flex justify-between items-center mb-4" {...provided.dragHandleProps}>
            <h3 className="text-lg font-semibold text-gray-700">{getElementTypeName(element.type)}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddChild(!showAddChild)}
                className="p-1 text-blue-500 hover:text-blue-700"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => removeElement(element.id)}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {showAddChild && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-semibold mb-2">Add Child Element</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ElementTypes).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleAddChild(value)}
                    className="text-left text-blue-500 hover:text-blue-700 text-sm p-1"
                  >
                    {key.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                <>
                  <textarea
                    value={element.description || ''}
                    onChange={(e) => updateElement(element.id, { description: e.target.value })}
                    className="w-full p-2 mb-4 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-16"
                    placeholder="List Description"
                  />
                  <Droppable droppableId={element.id} type="LIST">
                    {(provided) => {
                      const ListTag = element.type === 'ul' ? 'ul' : 'ol';
                      return (
                        <ListTag
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`pl-5 ${element.type === 'ul' ? 'list-disc' : 'list-decimal'}`}
                        >
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
          ) : !['ul', 'ol', 'br'].includes(element.type) ? (
            <>
              <FormattedInput
                value={element.content}
                onChange={(value) => updateElement(element.id, { content: value })}
                placeholder={`${getElementTypeName(element.type)} content`}
                onAddDescription={toggleDescription}
              />
              {(showDescription || element.description) && (
                <textarea
                  value={element.description || ''}
                  onChange={(e) => updateElement(element.id, { description: e.target.value })}
                  placeholder="Description/Instructions for AI"
                  className="w-full p-2 mt-4 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-16"
                />
              )}
            </>
          ) : null}

          {/* Render nested elements */}
          {element.children && element.children.length > 0 && (
  <Droppable droppableId={`${element.id}-children`} type="ELEMENT">
    {(provided) => (
      <div ref={provided.innerRef} {...provided.droppableProps} className="mt-4">
        {element.children.map((childElement, childIndex) => (
          <Element
            key={childElement.id}
            element={childElement}
            index={childIndex}
            updateElement={updateElement}
            removeElement={removeElement}
            modifyListItem={modifyListItem}
            insertVariable={insertVariable}
            addNestedSpan={addNestedSpan}
            updateNestedSpan={updateNestedSpan}
            removeNestedSpan={removeNestedSpan}
            addNestedElement={addNestedElement}
            level={level + 1}
          />
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
)}
          </div>
        )}
    </Draggable>
  );
};

/**
 * Sidebar component to add new elements to the template.
 */
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
        content: defaultContent[type] || 'New element',
        description: ['ul', 'ol'].includes(type) ? "Follow the instructions mentioned in List description" : null,
        isDynamic: false,
        listItemDescription: null,
        hasDescription: ['ul', 'ol'].includes(type),
        children: []
      }
    ]);
  }, []);

  /**
   * Adds a nested element to a parent element.
   */
  const addNestedElement = useCallback((parentId, type) => {
    setElements((prev) => {
      const updateElementsRecursively = (elements) => {
        return elements.map((el) => {
          if (el.id === parentId) {
            return {
              ...el,
              children: [
                ...(el.children || []),
                {
                  id: uuidv4(),
                  type,
                  content: defaultContent[type] || 'New element',
                  description: ['ul', 'ol'].includes(type) ? "Follow the instructions mentioned in List description" : null,
                  isDynamic: false,
                  listItemDescription: null,
                  hasDescription: ['ul', 'ol'].includes(type),
                  children: []
                }
              ]
            };
          }
          if (el.children) {
            return {
              ...el,
              children: updateElementsRecursively(el.children)
            };
          }
          return el;
        });
      };
      return updateElementsRecursively(prev);
    });
  }, []);

  /**
   * Updates properties of a specific element.
   */
  const updateElement = useCallback((id, updates) => {
    setElements((prev) => {
      const updateElementsRecursively = (elements) => {
        return elements.map((el) => {
          if (el.id === id) {
            const updatedElement = { ...el, ...updates };
            if (['ul', 'ol'].includes(updatedElement.type)) {
              if (updatedElement.isDynamic) {
                updatedElement.content = [];
              }
            }
            return updatedElement;
          }
          if (el.children) {
            return {
              ...el,
              children: updateElementsRecursively(el.children)
            };
          }
          return el;
        });
      };
      return updateElementsRecursively(prev);
    });
  }, []);

  // Rest of your existing code...

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
                          insertVariable={insertVariable}
                          addNestedSpan={addNestedSpan}
                          updateNestedSpan={updateNestedSpan}
                          removeNestedSpan={removeNestedSpan}
                          addNestedElement={addNestedElement}
                          level={0}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Rest of your existing sections... */}
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default JsonTemplateBuilderRevert;
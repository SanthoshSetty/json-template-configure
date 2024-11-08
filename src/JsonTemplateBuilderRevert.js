import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon, MinusIcon, TrashIcon, VariableIcon, MenuIcon } from '@heroicons/react/solid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

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

const AddElementSidebar = ({ addElement, parentId = null }) => (
  <div className="w-full md:w-64 bg-white shadow-md rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Add Elements</h2>
    {Object.entries(ElementTypes).map(([key, value]) => (
      <button
        key={key}
        onClick={() => addElement(value, parentId)}
        className="block w-full mb-2 text-left text-blue-500 hover:text-blue-700 transition-colors duration-200"
      >
        Add {key.replace(/_/g, ' ')}
      </button>
    ))}
  </div>
);

const Element = ({
  element,
  index,
  updateElement,
  removeElement,
  addElement, // Add this to allow adding nested children
  modifyListItem,
  addNestedSpan,
  updateNestedSpan,
  removeNestedSpan
}) => {
  const [showDescription, setShowDescription] = useState(!!element.description);

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

  return (
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
                            <li key={item.id} className="mb-4 p-4 bg-gray-50 rounded-md">
                              <textarea
                                value={item.content}
                                onChange={(e) => modifyListItem(element.id, item.id, 'content', e.target.value)}
                                className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 h-16"
                                placeholder="List item content"
                              />
                              <input
                                value={item.description || ''}
                                onChange={(e) => modifyListItem(element.id, item.id, 'description', e.target.value)}
                                className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 h-8"
                                placeholder="Item description"
                              />
                            </li>
                          ))}
                          {provided.placeholder}
                        </ListTag>
                      );
                    }}
                  </Droppable>
                  <button
                    onClick={() => modifyListItem(element.id, null, 'add')}
                    className="mt-4 p-1 text-green-500 hover:text-green-700 flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-1" /> Add Item
                  </button>
                </>
              )}
            </>
          )}

          {element.type !== 'ul' && element.type !== 'ol' && element.type !== 'br' && (
            <>
              <textarea
                value={element.content || ''}
                onChange={(e) => updateElement(element.id, { content: e.target.value })}
                className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 mb-2"
                placeholder="Content"
              />
              {showDescription && (
                <textarea
                  value={element.description || ''}
                  onChange={(e) => updateElement(element.id, { description: e.target.value })}
                  placeholder="Description/Instructions for AI"
                  className="w-full p-2 mt-4 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-16"
                />
              )}
            </>
          )}

          {/* Add Child Elements */}
          <div className="mt-4">
            <AddElementSidebar addElement={addElement} parentId={element.id} />
          </div>

          {/* Render Nested Children */}
          <Droppable droppableId={`children-${element.id}`} type="ELEMENT">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="ml-4 mt-4">
                {element.children.map((childElement, childIndex) => (
                  <Element
                    key={childElement.id}
                    element={childElement}
                    index={childIndex}
                    updateElement={updateElement}
                    removeElement={removeElement}
                    addElement={addElement}
                    modifyListItem={modifyListItem}
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
      )}
    </Draggable>
  );
};

const JsonTemplateBuilderRevert = () => {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    console.log('Updated elements:', elements);
  }, [elements]);

  const addElement = useCallback((type, parentId = null) => {
    setElements((prev) => {
      const newElement = {
        id: uuidv4(),
        type,
        content: defaultContent[type] || 'New element',
        description: null,
        isDynamic: false,
        children: []
      };

      if (!parentId) {
        return [...prev, newElement];
      } else {
        return prev.map((el) => {
          if (el.id === parentId) {
            return {
              ...el,
              children: [...el.children, newElement],
            };
          }
          return el;
        });
      }
    });
  }, []);

  const removeElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  const updateElement = useCallback((id, updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  }, []);

  return (
    <div className="font-sans p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder with Nested Elements</h1>
        <DragDropContext onDragEnd={() => {}}>
          <div className="flex flex-col md:flex-row gap-8">
            <AddElementSidebar addElement={addElement} />
            <div className="flex-1">
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
                        addElement={addElement}
                        modifyListItem={() => {}}
                        addNestedSpan={() => {}}
                        updateNestedSpan={() => {}}
                        removeNestedSpan={() => {}}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default JsonTemplateBuilderRevert;

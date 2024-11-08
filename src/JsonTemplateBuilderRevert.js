import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon, TrashIcon, MenuIcon } from '@heroicons/react/solid';
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
  ul: [{ id: uuidv4(), content: 'List item 1' }],
  ol: [{ id: uuidv4(), content: 'List item 1' }],
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
    <Droppable droppableId="sidebar" type="ELEMENT">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {Object.entries(ElementTypes).map(([key, value], index) => (
            <Draggable draggableId={value} index={index} key={value}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="block w-full mb-2 text-left text-blue-500 hover:text-blue-700 transition-colors duration-200 cursor-pointer p-2 bg-gray-100 rounded"
                >
                  Add {key.replace(/_/g, ' ')}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

const Element = ({ element, index, updateElement, removeElement, addElement }) => (
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
        <textarea
          value={element.content || ''}
          onChange={(e) => updateElement(element.id, { content: e.target.value })}
          className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 mb-2"
          placeholder="Content"
        />
        <Droppable droppableId={`children-${element.id}`} type="ELEMENT">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="ml-4 mt-4 p-4 bg-gray-50 rounded-md">
              {element.children.map((childElement, childIndex) => (
                <Element
                  key={childElement.id}
                  element={childElement}
                  index={childIndex}
                  updateElement={updateElement}
                  removeElement={(id) => updateElement(element.id, {
                    children: element.children.filter((child) => child.id !== id)
                  })}
                  addElement={addElement}
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

const JsonTemplateBuilderRevert = () => {
  const [elements, setElements] = useState([]);

  const addElement = useCallback((type, parentId = null) => {
    setElements((prev) => {
      const newElement = {
        id: uuidv4(),
        type,
        content: defaultContent[type] || 'New element',
        children: []
      };

      if (!parentId) {
        return [...prev, newElement];
      } else {
        return prev.map((el) => {
          if (el.id === parentId) {
            return {
              ...el,
              children: [...el.children, newElement]
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

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Dropped in the same spot
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (source.droppableId === 'sidebar') {
      // Dragging from the sidebar to the main builder
      if (destination.droppableId === 'elements') {
        // Add as a top-level element
        addElement(draggableId);
      } else if (destination.droppableId.startsWith('children-')) {
        // Add as a child element
        const parentId = destination.droppableId.replace('children-', '');
        addElement(draggableId, parentId);
      }
    } else {
      // Rearranging within the main builder
      // (For simplicity, we're ignoring internal reordering in this implementation)
    }
  };

  return (
    <div className="font-sans p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder with Nested Elements</h1>
        <DragDropContext onDragEnd={handleDragEnd}>
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

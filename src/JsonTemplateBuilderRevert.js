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

const FormattingToolbar = ({ applyFormatting }) => (
  <div className="flex space-x-2 mb-2">
    <button onClick={() => applyFormatting('bold')} className="text-gray-700 hover:text-gray-900">
      <strong>B</strong>
    </button>
    <button onClick={() => applyFormatting('italic')} className="text-gray-700 hover:text-gray-900">
      <em>I</em>
    </button>
    <button onClick={() => applyFormatting('lineBreak')} className="text-gray-700 hover:text-gray-900">
      Add Break
    </button>
  </div>
);

const ListItem = ({ item, index, elementId, modifyListItem, insertVariable, insertBreak, addNestedSpan, updateNestedSpan, removeNestedSpan }) => {
  const applyFormatting = (type) => {
    let newText = item.content;
    if (type === 'bold') {
      newText = `${newText}<strong></strong>`;
    } else if (type === 'italic') {
      newText = `${newText}<em></em>`;
    } else if (type === 'lineBreak') {
      newText = `${newText}<br>`;
    }
    modifyListItem(elementId, item.id, 'content', newText);
  };

  return (
    <Draggable draggableId={item.id} index={index} key={item.id}>
      {(provided) => (
        <div
          className="mb-4 p-4 bg-gray-50 rounded-md"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="flex items-center mb-2">
            <input
              value={item.content}
              onChange={(e) => modifyListItem(elementId, item.id, 'content', e.target.value)}
              className="flex-grow p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List item content"
            />
            <button
              onClick={() => modifyListItem(elementId, item.id, 'remove')}
              className="ml-2 text-red-500 hover:text-red-700 transition-colors duration-200"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
          <FormattingToolbar applyFormatting={applyFormatting} />
          <input
            value={item.description}
            onChange={(e) => modifyListItem(elementId, item.id, 'description', e.target.value)}
            className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            placeholder="Item description"
          />
        </div>
      )}
    </Draggable>
  );
};

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
}) => {
  const applyFormatting = (type) => {
    let newText = element.content;
    if (type === 'bold') {
      newText = `${newText}<strong></strong>`;
    } else if (type === 'italic') {
      newText = `${newText}<em></em>`;
    } else if (type === 'lineBreak') {
      newText = `${newText}<br>`;
    }
    updateElement(element.id, { content: newText });
  };

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
            <button onClick={() => removeElement(element.id)} className="text-red-500 hover:text-red-700 transition-colors duration-200">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
          <FormattingToolbar applyFormatting={applyFormatting} />
          {element.type !== 'br' && (
            <input
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      )}
    </Draggable>
  );
};

const JsonTemplateBuilderRevert = () => {
  const [elements, setElements] = useState([]);

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

  const updateElement = useCallback((id, updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
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
          } else if (action === 'content') {
            newContent = newContent.map((item) => (item.id === itemId ? { ...item, content: value } : item));
          }
          return { ...el, content: newContent };
        }
        return el;
      })
    );
  }, []);

  return (
    <div className="font-sans p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder</h1>
        <DragDropContext>
          <div className="flex flex-col md:flex-row gap-8">
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
                          removeElement={() => setElements((prev) => prev.filter((el) => el.id !== element.id))}
                          modifyListItem={modifyListItem}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default JsonTemplateBuilderRevert;
package dev.kammit.service;

import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;

import dev.kammit.model.Board;
import dev.kammit.model.BoardColumn;
import dev.kammit.model.Card;
import dev.kammit.repository.BoardColumnRepository;
import dev.kammit.repository.BoardRepository;
import dev.kammit.repository.CardRepository;

/**
 * KambanService
 */
@Service
public class KambanService {
    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final CardRepository cardRepository;
    public KambanService(
            BoardRepository boardRepository,
            BoardColumnRepository boardColumnRepository,
            CardRepository cardRepository) {
        this.boardRepository = boardRepository;
        this.boardColumnRepository = boardColumnRepository;
        this.cardRepository = cardRepository;
    }
    public Board createBoard(Board board) {
        BoardColumn todo = new BoardColumn();
        todo.setTitle("To-Do ｡˚🐈‍⬛.𖥔 ݁ ˖");
        todo.setPosition(0);
        todo.setBoard(board);
    
        BoardColumn doing = new BoardColumn();
        doing.setTitle("Doing (be patient damn) ‧₊˚🖇️✩ ₊˚🎧⊹♡📷");
        doing.setPosition(1);
        doing.setBoard(board);
    
        BoardColumn done = new BoardColumn();
        done.setTitle("Done (you're welcome?) ༘⋆📼˚ ༘ ೀ⋆｡˚");
        done.setPosition(2);
        done.setBoard(board);
    
        board.getColumns().add(todo);
        board.getColumns().add(doing);
        board.getColumns().add(done);
    
        return boardRepository.save(board);
    }   

    public Board getBoard(Long id) {
    return boardRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Board not found: " + id));
    }

    public Card createCard(Long columnId, Card card) {
        BoardColumn column = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new NoSuchElementException("Column not found: " + columnId));
        card.setBoardColumn(column);
        card.setPosition(column.getCards().size());
        return cardRepository.save(card);
    }

    public Card updateCard(Long cardId, Card updatedCard) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new NoSuchElementException("Card not found: " + cardId));
        if (updatedCard.getTitle() != null) card.setTitle(updatedCard.getTitle());
        if (updatedCard.getDescription() != null) card.setDescription(updatedCard.getDescription());
        return cardRepository.save(card);
    }

    public Card moveCard(Long cardId, Long newColumnId, int newPosition) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new NoSuchElementException("Card not found: " + cardId));
        BoardColumn newColumn = boardColumnRepository.findById(newColumnId)
                .orElseThrow(() -> new NoSuchElementException("Column not found: " + newColumnId));
        card.setBoardColumn(newColumn);
        card.setPosition(newPosition);
        return cardRepository.save(card);
    }

    public void deleteCard(Long cardId) {
    if (!cardRepository.existsById(cardId)) {
        throw new NoSuchElementException("Card not found: " + cardId);
    }
    cardRepository.deleteById(cardId);
    }
}
